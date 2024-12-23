import React from 'react';
import { createContext, useState } from "react";

export const TargetUserContext = createContext([{}, () => null])

export function TargetUserProvider({ children }: any) {
    const [targetUser, setTargetUser] = useState<any>({})

    return <TargetUserContext.Provider value={[targetUser, setTargetUser]}>
        {children}
    </TargetUserContext.Provider>
}
