
export type MEMBER_ROLE = "ADMIN" | "EDITOR" | "VIEWER";

export interface UserProps {
    id: string;
    name: string;
    image: string | null;
    email: string;
    createdAt: Date;
    updatedAt: Date;
} 

export interface MemberProps {
    id: string;
    role: MEMBER_ROLE; 
    userId: string;
    workspaceId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface WorkspaceProps {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    members: MemberProps[];
}
