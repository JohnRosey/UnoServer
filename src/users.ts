type User = {
    id: string;
    name: string;
    room: string;
}

let users: User[] = [];

const addUser = ({ id, name, room }: { id: string; name: string; room: string }): { newUser?: User; error?: string } => {
    const numberOfUsersInRoom = users.filter(user => user.room === room).length;

    if (numberOfUsersInRoom === 2) {
        return { error: 'Room full' };
    }

    const newUser: User = { id, name, room };
    users.push(newUser);
    return { newUser };
}

const removeUser = (id: string): User | undefined => {
    const removeIndex = users.findIndex(user => user.id === id);

    if (removeIndex !== -1) {
        return users.splice(removeIndex, 1)[0];
    }
}

const getUser = (id: string): User | undefined => {
    return users.find(user => user.id === id);
}

const getUsersInRoom = (room: string): User[] => {
    return users.filter(user => user.room === room);
}

export { addUser, removeUser, getUser, getUsersInRoom };
