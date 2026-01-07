'use client';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-4" style={{ flexShrink: 0 }}>
      <div className="container mx-auto px-4 text-center">
        <p>&copy; {new Date().getFullYear()} MovieXplorer. All rights reserved.</p>
      </div>
    </footer>
  );
}
