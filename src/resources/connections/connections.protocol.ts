interface AddConnection {
  userId: string;
  connectionId: string;
}

interface RemoveConnection {
  userId: string;
  connectionId: string;
}

export { AddConnection, RemoveConnection };
