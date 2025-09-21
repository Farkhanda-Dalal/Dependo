// src/components/Sidebar.tsx
import React from 'react';
import FolderTree from './FolderTree';
import '../Sidebar.css'
import type { Folder } from '../types'; // <-- Import the new type

interface SidebarProps {
    folders: Folder; // <-- Use the Folder type
    onFolderClick: (folderPath: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ folders, onFolderClick }) => {
    return (
        <aside className="sidebar">
            <h2 className="sidebar-title">Project Folders</h2>
            <div className="root-folder-item" onClick={() => onFolderClick('root')}>
                <span className="folder-name">📂 Project Root</span>
            </div>
            <FolderTree data={folders} onFolderClick={onFolderClick} />
        </aside>
    );
};

export default Sidebar;