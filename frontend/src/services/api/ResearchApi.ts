import type {
  ChatMessage,
  Conversation,
  Dataset,
  DatasetRow,
  DemoScenario,
  LabSession,
  MessageAttachment,
  ResearchContext,
  ResearchStudy,
} from '@/types/research'

export interface SendInput {
  text: string
  context: ResearchContext
  localAttachments: MessageAttachment[]
  clientMessageId: string
  revision: number
}
export interface ResearchApi {
  readonly mode: 'demo' | 'http'
  listStudies(scenario?: DemoScenario): Promise<ResearchStudy[]>
  getStudy(id: string): Promise<ResearchStudy>
  listConversations(): Promise<Conversation[]>
  getConversation(id: string): Promise<Conversation>
  createConversation(
    context: ResearchContext,
    title: string,
    operationId?: string,
  ): Promise<Conversation>
  renameConversation(id: string, title: string, revision: number): Promise<void>
  deleteConversation(id: string, revision: number): Promise<void>
  sendMessage(
    id: string,
    input: SendInput,
    signal?: AbortSignal,
    scenario?: DemoScenario,
  ): Promise<{
    userMessage: ChatMessage
    assistantMessage: ChatMessage
    conversationRevision: number
  }>
  listSessions(): Promise<LabSession[]>
  getSession(id: string): Promise<LabSession>
  saveSession(session: LabSession): Promise<LabSession>
  getDataset(id: string): Promise<Dataset>
  getRows(id: string, revision: string): Promise<DatasetRow[]>
}
