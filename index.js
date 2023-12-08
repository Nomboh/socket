const socketIo = require("socket.io")
const http = require("http")
const express = require("express")
const cors = require("cors")
const app = express()
const dotenv = require("dotenv")

const server = http.createServer(app)

const io = socketIo(server)

dotenv.config()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
	res.send("Socket server is running.")
})

let users = []

// add user to the socket server
const addUser = (userId, socketId) => {
	!users.some((user) => user.userId === userId) &&
		users.push({ userId, socketId })
}

// remove user from the socket server
const removeUser = (socketId) => {
	users = users.filter((user) => user.socketId !== socketId)
}

// get user from the socket server
const getUser = (receiverId) => {
	return users.find((user) => user?.userId === receiverId)
}

io.on("connection", (socket) => {
	console.log("New client connected")

	socket.on("addUser", (userId) => {
		addUser(userId, socket.id)
		io.emit("getUsers", users)
	})

	// send and get message
	socket.on(
		"sendMessage",
		({ senderId, receiverId, text, image, id, conversationId, senderName }) => {
			const user = getUser(receiverId)
			io.to(user?.socketId).emit("getMessage", {
				senderId,
				text,
				image,
				id,
				conversationId,
				senderName,
			})

			// send notification

			io.to(user?.socketId).emit("getNotifications", {
				senderId,
				senderName,
				text: text ? text : "Sent a image",
				createdAt: Date.now(),
				seen: true,
				id,
				conversationId,
			})
		}
	)

	// disconnect is fired when a client leaves the server
	socket.on("disconnect", () => {
		console.log("Client disconnected")
		removeUser(socket.id)
		io.emit("getUsers", users)
	})
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
