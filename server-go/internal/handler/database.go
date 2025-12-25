package handler

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq"
)

type DBHandler struct{}

func NewDBHandler() *DBHandler {
	return &DBHandler{}
}

type dbConfig struct {
	Type     string `json:"type"`
	Host     string `json:"host"`
	Port     int    `json:"port"`
	User     string `json:"user"`
	Password string `json:"password"`
	Database string `json:"database"`
	SSL      bool   `json:"ssl"`
}

func (h *DBHandler) Connect(c *gin.Context) {
	var cfg dbConfig
	if err := c.ShouldBindJSON(&cfg); err != nil || cfg.Host == "" || cfg.User == "" {
		c.JSON(400, gin.H{"success": false, "error": "Host and user are required"})
		return
	}

	db, err := h.openDB(&cfg)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Connection successful"})
}

func (h *DBHandler) GetDatabases(c *gin.Context) {
	var cfg dbConfig
	if err := c.ShouldBindJSON(&cfg); err != nil || cfg.Host == "" || cfg.User == "" {
		c.JSON(400, gin.H{"success": false, "error": "Host and user are required"})
		return
	}

	db, err := h.openDB(&cfg)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer db.Close()

	var databases []string
	var query string

	if cfg.Type == "postgres" {
		query = "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres', 'template0', 'template1') ORDER BY datname"
	} else {
		query = "SHOW DATABASES"
	}

	rows, err := db.Query(query)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var name string
		rows.Scan(&name)
		databases = append(databases, name)
	}

	c.JSON(200, gin.H{"success": true, "databases": databases})
}

func (h *DBHandler) GetSchema(c *gin.Context) {
	var cfg dbConfig
	if err := c.ShouldBindJSON(&cfg); err != nil || cfg.Host == "" || cfg.User == "" || cfg.Database == "" {
		c.JSON(400, gin.H{"success": false, "error": "Host, user, and database are required"})
		return
	}

	db, err := h.openDB(&cfg)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer db.Close()

	var rows *sql.Rows
	var query string

	if cfg.Type == "postgres" {
		query = `
			SELECT c.column_name, c.data_type, c.is_nullable = 'YES', COALESCE(pk.is_primary_key, false) AS is_primary_key, t.table_name
			FROM information_schema.columns c
			JOIN information_schema.tables t ON c.table_schema = t.table_schema AND c.table_name = t.table_name
			LEFT JOIN (
				SELECT a.attname AS column_name, t.relname AS table_name, true AS is_primary_key
				FROM pg_index i
				JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
				JOIN pg_class t ON t.oid = i.indrelid
				WHERE i.indisprimary
			) pk ON pk.column_name = c.column_name AND pk.table_name = c.table_name
			WHERE c.table_schema = 'public' AND t.table_schema = 'public'
			ORDER BY t.table_name, c.ordinal_position`
	} else {
		query = `
			SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
			FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?
			ORDER BY TABLE_NAME, ORDINAL_POSITION`
	}

	if cfg.Type == "postgres" {
		rows, err = db.Query(query)
	} else {
		rows, err = db.Query(query, cfg.Database)
	}

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	tables := make(map[string][]map[string]any)
	for rows.Next() {
		var tableName, colName, colType string
		if cfg.Type == "postgres" {
			var nullable, isPrimaryKey bool
			rows.Scan(&colName, &colType, &nullable, &isPrimaryKey, &tableName)
			tables[tableName] = append(tables[tableName], map[string]any{
				"name": colName, "type": colType, "nullable": nullable, "isPrimaryKey": isPrimaryKey,
			})
		} else {
			var nullable, colKey string
			rows.Scan(&tableName, &colName, &colType, &nullable, &colKey)
			tables[tableName] = append(tables[tableName], map[string]any{
				"name": colName, "type": colType, "nullable": nullable == "YES", "isPrimaryKey": colKey == "PRI",
			})
		}
	}

	// Convert map to array for frontend
	var tablesArray []map[string]any
	for name, cols := range tables {
		tablesArray = append(tablesArray, map[string]any{
			"name": name, "columns": cols,
		})
	}

	var formatted strings.Builder
	formatted.WriteString("Database Schema:\n\n")
	for _, table := range tablesArray {
		tableName := table["name"].(string)
		cols := table["columns"].([]map[string]any)
		formatted.WriteString(fmt.Sprintf("Table: %s\n  Columns:\n", tableName))
		for _, col := range cols {
			pk := ""
			if col["isPrimaryKey"].(bool) {
				pk = " (PRIMARY KEY)"
			}
			formatted.WriteString(fmt.Sprintf("    - %s %s%s\n", col["name"], col["type"], pk))
		}
		formatted.WriteString("\n")
	}

	c.JSON(200, gin.H{"success": true, "schema": gin.H{"tables": tablesArray, "formatted": formatted.String()}})
}

func (h *DBHandler) Execute(c *gin.Context) {
	var req struct {
		dbConfig
		SQL string `json:"sql"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.SQL == "" {
		c.JSON(400, gin.H{"success": false, "error": "SQL query is required"})
		return
	}
	if req.Host == "" || req.User == "" || req.Database == "" {
		c.JSON(400, gin.H{"success": false, "error": "Host, user, and database are required"})
		return
	}

	// Security check
	upper := strings.ToUpper(strings.TrimSpace(req.SQL))
	if !strings.HasPrefix(upper, "SELECT") && !strings.HasPrefix(upper, "SHOW") &&
		!strings.HasPrefix(upper, "DESCRIBE") && !strings.HasPrefix(upper, "EXPLAIN") && !strings.HasPrefix(upper, "WITH") {
		c.JSON(400, gin.H{"success": false, "error": "Only SELECT, SHOW, DESCRIBE, EXPLAIN queries are allowed"})
		return
	}

	db, err := h.openDB(&req.dbConfig)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer db.Close()

	rows, err := db.Query(req.SQL)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	cols, _ := rows.Columns()
	var results []string
	for rows.Next() {
		values := make([]any, len(cols))
		ptrs := make([]any, len(cols))
		for i := range values {
			ptrs[i] = &values[i]
		}
		rows.Scan(ptrs...)
		rowValues := make([]string, len(cols))
		for i := range cols {
			if b, ok := values[i].([]byte); ok {
				rowValues[i] = string(b)
			} else {
				rowValues[i] = fmt.Sprintf("%v", values[i])
			}
		}
		results = append(results, strings.Join(rowValues, "\t"))
	}

	c.JSON(200, gin.H{"success": true, "rows": results, "header": strings.Join(cols, "\t"), "rowCount": len(results), "hasTabs": true})
}

func (h *DBHandler) openDB(cfg *dbConfig) (*sql.DB, error) {
	port := cfg.Port
	if port == 0 {
		if cfg.Type == "postgres" {
			port = 5432
		} else {
			port = 3306
		}
	}

	dbType := cfg.Type
	if dbType == "" {
		dbType = "mysql"
	}

	if dbType == "postgres" {
		dsn := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable",
			cfg.User, cfg.Password, cfg.Host, port, cfg.Database)
		return sql.Open("postgres", dsn)
	}

	// MySQL
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/", cfg.User, cfg.Password, cfg.Host, port)
	if cfg.Database != "" {
		dsn += cfg.Database
	}
	if cfg.SSL {
		dsn += "?tls=true"
	}
	return sql.Open("mysql", dsn)
}
