import React from 'react';
import { BarrelIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-dark-wood/80 backdrop-blur-sm sticky top-0 z-10 border-b border-rich-gold/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-20">
            <BarrelIcon className="h-10 w-10 text-rich-gold mr-4" />
            <h1 className="text-4xl font-bold tracking-tight text-off-white font-serif">
                My Pocket Bartender
            </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;