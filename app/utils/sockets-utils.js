export async function tcpSafeSend(socket, data) {
  try {
    await new Promise((resolve, reject) => {
      socket.write(data, (error) => error ? reject(error) : resolve())
    })
  } catch (error) {
    console.log('[TCP][sent][error]', error)
  }
}

export function wsSafeSend(ws, data) {
  try {
    ws.send(data)
  } catch (error) {
    console.log('[WS][sent][error]', error)
  }
}

export async function socketMultipleSafeSend(socket, packages) {
  for (const packet of packages) {
    await socket.safeSend(packet)
  }
}