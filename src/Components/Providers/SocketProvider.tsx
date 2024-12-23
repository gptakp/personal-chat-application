import React from 'react';
import { createContext, useState } from "react";

export const SocketContext = createContext([null, () => null])

export function SocketProvider({ children }: any) {
    const [socket, setSocket] = useState<any>(null)

    return <SocketContext.Provider value={[socket, setSocket]}>
        {children}
    </SocketContext.Provider>
}
