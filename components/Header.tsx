import React from 'react';
import { WineIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-20">
            <WineIcon className="h-10 w-10 text-sky-500 mr-3" />
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                Pocket Sommelier
            </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;