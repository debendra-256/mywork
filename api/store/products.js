import { handleStoreRequest } from '../store.js'

export default function handler(request, response) {
  return handleStoreRequest(request, response, process.env, 'products')
}
