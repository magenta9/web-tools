## 实现计划 - Prompt 管理工具与 AI Chat

问题陈述：
实现一个 AI 对话模板管理系统，支持 prompt 的收集、标签分类、检索和使用。同时构建一个 AI 
Chat 工具来应用这些模板，提供完整的 AI 对话体验。

需求：
- Prompt 管理：支持新增、删除、检索、标签分类
- 基础字段：标题、内容、标签、创建时间
- 简单标签系统（多标签支持）
- 基础搜索功能（按标题、内容、标签）
- 混合视图：支持列表和卡片两种显示模式
- 独立管理页面 + 嵌入式组件支持
- AI Chat 工具集成 prompt 选择功能
- PostgreSQL 存储

背景：
项目已有完整的 Next.js + Go 后端架构，PostgreSQL 数据库，以及现有的 AI 工具（AI SQL、AI 翻
译等）。需要扩展数据库 schema 并添加新的 API 端点和前端页面。

提议解决方案：
创建 prompt 管理系统和 AI Chat 工具，采用现有的架构模式，复用共享组件和 hooks。

任务分解：

Task 1: 扩展数据库 schema 和后端 API
- 在 PostgreSQL 中添加 prompts 表（id, title, content, tags, created_at, updated_at）
- 在 Go 后端添加 prompt CRUD API 端点（/api/prompts）
- 添加搜索和标签筛选 API
- Demo: 可通过 API 测试工具验证 prompt 的增删改查功能

Task 2: 创建 Prompt 管理核心组件
- 创建 PromptCard 和 PromptList 组件
- 实现 usePrompts hook 管理状态和 API 调用
- 创建 PromptForm 组件用于新增/编辑
- 实现基础的搜索和标签筛选逻辑
- Demo: 可以在独立页面中管理 prompt（增删改查）

Task 3: 构建 Prompt 管理页面
- 创建 /prompt 页面，集成管理组件
- 实现混合视图切换（列表/卡片模式）
- 添加搜索栏和标签筛选器
- 集成到主页工具列表
- Demo: 完整的 prompt 管理界面，支持所有管理功能

Task 4: 创建嵌入式 Prompt 选择器组件
- 创建 PromptSelector 组件，支持快速选择和预览
- 实现 prompt 模板变量替换功能
- 创建轻量级的 prompt 浏览和搜索界面
- Demo: 可在任意页面嵌入 prompt 选择功能

Task 5: 构建 AI Chat 工具页面
- 创建 /chat 页面和 ChatInterface 组件
- 集成 Ollama API 调用（复用现有 /api/ollama/chat）
- 实现对话历史管理和显示
- 集成 PromptSelector 组件
- Demo: 完整的 AI 对话界面，支持选择 prompt 模板

Task 6: 完善用户体验和集成
- 添加 prompt 使用统计和最近使用功能
- 在其他 AI 工具中集成 prompt 选择器
- 优化搜索性能和用户交互
- 添加导入/导出功能
- Demo: 完整的 prompt 生态系统，各工具间无缝集成
