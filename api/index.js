const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({ env: 'long-d0g1dx0nl38c1394f' })
const db = app.database()

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

function response(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) }
}

exports.main_handler = async (event) => {
  const method = event.httpMethod || 'GET'
  const path = (event.path || '/').replace(/\/$/, '')

  // CORS preflight
  if (method === 'OPTIONS') return response(200, '')

  try {
    // GET /projects
    if (method === 'GET' && path === '/projects') {
      const res = await db.collection('projects').orderBy('updatedAt', 'desc').get()
      return response(200, res.data || [])
    }

    // POST /projects
    if (method === 'POST' && path === '/projects') {
      const body = JSON.parse(event.body || '{}')
      const doc = db.collection('projects').doc(body.id)
      const exist = await doc.get()
      if (exist.data && exist.data.length > 0) {
        await doc.set(body)
      } else {
        await db.collection('projects').add(body)
      }
      return response(200, { ok: true })
    }

    // DELETE /projects/:id
    if (method === 'DELETE' && path.startsWith('/projects/')) {
      const id = path.replace('/projects/', '')
      await db.collection('projects').doc(id).remove()
      return response(200, { ok: true })
    }

    // GET /journals
    if (method === 'GET' && path === '/journals') {
      const res = await db.collection('journals').orderBy('date', 'desc').get()
      return response(200, res.data || [])
    }

    // POST /journals
    if (method === 'POST' && path === '/journals') {
      const body = JSON.parse(event.body || '{}')
      await db.collection('journals').add(body)
      return response(200, { ok: true })
    }

    // DELETE /journals/:id
    if (method === 'DELETE' && path.startsWith('/journals/')) {
      const id = path.replace('/journals/', '')
      await db.collection('journals').doc(id).remove()
      return response(200, { ok: true })
    }

    return response(404, { error: 'Not found' })
  } catch (err) {
    return response(500, { error: err.message })
  }
}
