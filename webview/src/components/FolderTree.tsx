// src/components/FolderTree.tsx
import React from 'react';
import type { Folder } from '../types'; // <-- Import the new type

interface FolderTreeProps {
    data: Folder; // <-- Use the Folder type
    onFolderClick: (folderPath: string) => void;
    currentPath?: string;
}

const FolderTree: React.FC<FolderTreeProps> = ({ data, onFolderClick, currentPath = '' }) => {
    const renderFolders = (folders: Folder) => { // <-- Use the Folder type here as well
        return Object.keys(folders).map(folderName => {
            const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
            return (
                <div key={newPath} className="folder-item">
                    <div onClick={() => onFolderClick(newPath)} className="folder-name">
                        📂 {folderName}
                    </div>
                    {Object.keys(folders[folderName]).length > 0 && (
                        <div className="sub-folder-list">
                            <FolderTree data={folders[folderName]} onFolderClick={onFolderClick} currentPath={newPath} />
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="folder-tree">
            {renderFolders(data)}
        </div>
    );
};

export default FolderTree;