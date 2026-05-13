const DB_NAME = 'matruvani-offline'
const STORE_NAME = 'queue'

async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
  })
}

export async function addToQueue(item) {
  // item = { endpoint, method, body, timestamp, retryCount: 0 }
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).add({ ...item, timestamp: Date.now(), retryCount: 0 })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getQueue() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function removeFromQueue(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function updateRetryCount(id, retryCount) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getReq = store.get(id)
    getReq.onsuccess = () => {
      const item = getReq.result
      if (item) {
        item.retryCount = retryCount
        const putReq = store.put(item)
        putReq.onsuccess = () => resolve()
        putReq.onerror = () => reject(putReq.error)
      } else {
        resolve()
      }
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

export async function processQueue(apiBaseUrl) {
  const items = await getQueue()
  for (const item of items) {
    if (item.retryCount >= 5) continue
    try {
      const res = await fetch(apiBaseUrl + item.endpoint, {
        method: item.method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(item.body)
      })
      if (res.ok) {
        await removeFromQueue(item.id)
      } else {
        await updateRetryCount(item.id, item.retryCount + 1)
      }
    } catch {
      await updateRetryCount(item.id, item.retryCount + 1)
    }
  }
}
