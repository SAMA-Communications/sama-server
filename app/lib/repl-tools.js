import fs from "node:fs"
import fsPromises from "node:fs/promises"
import vm from "node:vm"
import { exec } from "node:child_process"
import repl from "node:repl"
import net from "node:net"
import http from "node:http"

import { CONSTANTS } from "../constants/constants.js"

// example: curl --no-progress-meter -sSNT. -H "api-key: ****" localhost:5010

const httpReplService = async (replOptions, httpOptions) => {
  const { ctx } = replOptions
  const { accessKey, port } = httpOptions

  const server = http.createServer((req, res) => {
    if (req.headers[CONSTANTS.HTTP_REPL_ACCESS_KEY_HEADER] !== accessKey) {
      return res.end("Invalid access-key")
    }

    res.setHeader("content-type", "multipart/octet-stream")

    const replService = repl.start({
      prompt: "curl repl> ",
      input: req,
      output: res,
      terminal: false,
      useColors: true,
      useGlobal: false,
    })

    const context = vm.createContext({ ...ctx })

    replService.context = context

    req.on("error", (error) => replService.close())
    req.on("end", () => replService.close())

    res.on("error", (error) => replService.close())
    res.on("end", () => replService.close())

    replService.on("close", () => !res.closed && res.end("REPL closed"))
    replService.on("error", (error) => {
      replService.close()
      !res.closed && res.end("REPL closed")
      !req.closed && req.destroy()
    })
  })

  return new Promise((resolve, reject) => {
    server.listen(port, () => resolve(port))
  })
}

// example write: cat > ./pipe-repl.in
// example read: tail -f ./pipe-repl.out

const fileReplService = async (replOptions, fileOptions) => {
  const { ctx } = replOptions
  const { fileIn, fileOut } = fileOptions

  await fsPromises.rm(fileIn, { force: true }).catch((error) => {})
  await fsPromises.rm(fileOut, { force: true }).catch((error) => {})

  await new Promise((resolve, reject) => {
    exec(`mkfifo ${fileIn}`, (error, out, outErr) => {
      if (error) {
        return reject(error)
      }
      resolve()
    })
  })

  const cmdInputPipe = fs.createReadStream(fileIn, { encoding: "utf8" })
  const cmdOutPipe = fs.createWriteStream(fileOut, { encoding: "utf8" })

  const replService = repl.start({
    prompt: "file repl> ",
    input: cmdInputPipe,
    output: cmdOutPipe,
    terminal: false,
    useColors: true,
    useGlobal: false,
  })

  const context = vm.createContext({ ...ctx })

  replService.context = context

  replService.on("error", (error) => {
    replService.close()
    cmdInputPipe.close()
  })

  cmdInputPipe.on("end", () => {
    replService.close()
    fileReplService(replOptions, fileOptions)
  })
}

// example: nc -U ./net-repl.socket

const netReplService = async (replOptions, fileOptions) => {
  const { ctx } = replOptions
  const { socketHandler } = fileOptions

  await fsPromises.rm(socketHandler, { force: true }).catch((error) => {})

  const server = net.createServer((socket) => {
    const replService = repl.start({
      prompt: "socket repl> ",
      input: socket,
      output: socket,
      terminal: false,
      useColors: true,
      useGlobal: false,
    })

    const context = vm.createContext({ ...ctx })

    replService.context = context

    socket.on("end", () => replService.close())
    socket.on("error", (error) => replService.close())
    replService.on("close", () => !socket.closed && socket.end("REPL closed"))
  })

  return new Promise((resolve, reject) => {
    server.listen(socketHandler, () => resolve(socketHandler))
  })
}

export const startReplServices = async (replOptions, httpOptions, netOptions, fileOptions) => {
  if (httpOptions.accessKey) {
    await httpReplService(replOptions, httpOptions)
  }
  if (netOptions.socketHandler) {
    await netReplService(replOptions, netOptions)
  }
  if (fileOptions.fileIn && fileOptions.fileOut) {
    await fileReplService(replOptions, fileOptions)
  }
}
