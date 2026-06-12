"use client";

import { createContext, useContext, type ReactNode } from "react";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  farm: {
    id?: string;
    name: string;
    location: string | null;
    acreage: number | null;
    createdAt?: string;
    updatedAt?: string;
  };
};

type UserContextValue = {
  user: CurrentUser | null;
  setUser: (user: CurrentUser | null) => void;
};

const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => {},
});

export function UserProvider({
  user,
  setUser,
  children,
}: {
  user: CurrentUser | null;
  setUser: (user: CurrentUser | null) => void;
  children: ReactNode;
}) {
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(UserContext).user;
}

export function useUserContext() {
  return useContext(UserContext);
}
