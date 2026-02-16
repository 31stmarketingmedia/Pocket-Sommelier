import React from 'react';
import { BarrelIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-classic-brown sticky top-0 z-10 border-b border-accent-gold/60 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-20">
            <BarrelIcon className="h-10 w-10 text-accent-gold mr-4" />
            <h1 className="text-4xl font-bold tracking-tight text-text-white font-serif">
                My Pocket Bartender
            </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;