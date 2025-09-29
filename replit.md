# PSD Editor

## Overview
A React-based PSD (Photoshop Document) editor application that allows users to import, edit, and manipulate PSD files in a web interface. Built with React, TypeScript, Vite, and Fabric.js for canvas manipulation.

## Recent Changes (September 29, 2025)
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
- **State Management**: MobX with React bindings
- **PSD Processing**: ag-psd library for reading PSD files

## Key Features
- PSD file import and parsing
- Canvas-based editing interface
- Layer management sidebar
- Property editing sidebar
- Text and image manipulation tools
- Undo/Redo functionality

## Development Setup
- Development server runs on port 5000
- Uses Vite for fast development and HMR
- TypeScript for type safety
- Path aliasing configured (@/ → src/)

## Deployment Configuration
- Target: Autoscale (stateless frontend)
- Build: npm run build (TypeScript compilation + Vite build)
- Run: npm run preview (production preview server)