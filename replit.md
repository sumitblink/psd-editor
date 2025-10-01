# PSD Editor

## Overview
A React-based PSD (Photoshop Document) editor application that allows users to import, edit, and manipulate PSD files in a web interface. Built with React, TypeScript, Vite, and Fabric.js for canvas manipulation.

## Recent Changes (October 1, 2025)
- ✅ Fixed layer drag-and-drop reordering with proper state updates and selection sync
- ✅ Implemented cut/copy/paste functionality with keyboard shortcuts (Ctrl/Cmd+C/X/V)
- ✅ Added basic shapes (Rectangle, Circle, Triangle) with full property editing support
- ✅ Fixed visibility toggle to properly update layer icons (Eye/EyeOff)
- ✅ Refactored to use Redux Toolkit async thunks for all canvas operations
- ✅ Fixed clipboard state management for proper cut/copy/paste behavior
- ✅ Fixed default fill color for text objects

## Previous Changes (September 29, 2025)
- Successfully imported GitHub repository and configured for Replit environment
- Configured Vite server to run on port 5000 with proper host settings (0.0.0.0)
- Set up frontend development workflow with hot module replacement
- Configured deployment settings for autoscale deployment
- All dependencies installed and application verified working

## Project Architecture
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.1.4 
- **UI Library**: Chakra UI for components
- **Canvas Library**: Fabric.js for graphics manipulation
- **State Management**: Redux Toolkit for state management
- **PSD Processing**: ag-psd library for reading PSD files

## Key Features
- PSD file import and parsing
- Canvas-based editing interface with Fabric.js
- Layer management with drag-and-drop reordering
- Property editing sidebar for all object types
- Text and image manipulation tools
- Shape creation tools (Rectangle, Circle, Triangle)
- Cut/Copy/Paste with keyboard shortcuts (Ctrl/Cmd+C/X/V)
- Layer visibility toggle
- Layer reordering (Send to Back/Bring to Front)
- Undo/Redo functionality
- Delete objects

## Development Setup
- Development server runs on port 5000
- Uses Vite for fast development and HMR
- TypeScript for type safety
- Path aliasing configured (@/ → src/)

## Deployment Configuration
- Target: Autoscale (stateless frontend)
- Build: npm run build (TypeScript compilation + Vite build)
- Run: npm run preview (production preview server)