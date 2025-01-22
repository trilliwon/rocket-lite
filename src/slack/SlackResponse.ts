export interface SlackResponse {
  delete_original?: boolean
  replace_original?: boolean
  response_type?: "in_channel"
  response_action?: string
  errors?: any
  blocks?: any[]
  text?: string
}