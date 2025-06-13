const sendMultiplePackages = async (socket, packages) => {
  for (const pack of packages) {
    await new Promise((resolve) => {
      socket.write(pack, () => resolve())
    })
  }
}

export default sendMultiplePackages