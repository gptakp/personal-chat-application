
import React from 'react';

import { createContext, useState } from "react";

export const UserContactsContext = createContext([[], () => null])

export function UserContactsProvider({ children }: any) {
    const [userContacts, setUserContacts] = useState<any>([])

    return <UserContactsContext.Provider value={[userContacts, setUserContacts]}>
        {children}
    </UserContactsContext.Provider>
}
