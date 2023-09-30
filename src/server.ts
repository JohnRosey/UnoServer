import express, { Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { addUser, removeUser, getUser, getUsersInRoom } from './users';

const PORT: number = Number(process.env.PORT) || 5000;

const app = express();
const server: HttpServer = new HttpServer(app);
const io: Server = new Server(server);

app.use(cors());

io.on('connection', (socket: Socket) => {
    handleSocketConnection(socket, io);
});

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
    app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

function handleSocketConnection(socket: Socket, io: Server) {
    socket.on('join', (payload, callback) => {
        const { error, newUser } = addUserToRoom(socket, payload);
        if (error) return callback(error);

        if (newUser) {
            socket.join(newUser.room);
            io.to(newUser.room).emit('roomData', { room: newUser.room, users: getUsersInRoom(newUser.room) });
            socket.emit('currentUserData', { name: newUser.name });
        }

        callback();
    });


    socket.on('initGameState', gameState => emitGameState(socket, 'initGameState', gameState));
    socket.on('updateGameState', gameState => emitGameState(socket, 'updateGameState', gameState));
    socket.on('sendMessage', (payload, callback) => emitMessage(socket, payload, callback));
    socket.on('disconnect', () => handleDisconnect(socket, io));
}

function addUserToRoom(socket: Socket, payload: any) {
    const numberOfUsersInRoom = getUsersInRoom(payload.room).length;
    const name = numberOfUsersInRoom === 0 ? 'Player 1' : 'Player 2';

    return addUser({
        id: socket.id,
        name,
        room: payload.room
    });
}

function emitGameState(socket: Socket, event: string, gameState: any) {
    const user = getUser(socket.id);
    if (user) {
        io.to(user.room).emit(event, gameState);
    }
}

function emitMessage(socket: Socket, payload: any, callback: Function) {
    const user = getUser(socket.id);
    if (!user) {
        console.error(`User with ID ${socket.id} not found.`);
        return;
    }

    io.to(user.room).emit('message', { user: user.name, text: payload.message });
    callback();
}


function handleDisconnect(socket: Socket, io: Server) {
    const user = removeUser(socket.id);
    if (user) {
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
    }
}
