import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#050505] pt-16 pb-8 border-t border-white/5">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-orangePrimary shrink-0"></div>
              OuroMind
            </Link>
            <p className="text-gray-500 text-sm">
              Train smarter. Counsel better. The next-generation AI patient simulator for mental health professionals.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-white">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-orangePrimary transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-orangePrimary transition-colors">How it Works</a></li>
              <li><Link to="/app" className="hover:text-orangePrimary transition-colors">Simulator Dashboard</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-white">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-orangePrimary transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-orangePrimary transition-colors">Clinical Research</a></li>
              <li><a href="#" className="hover:text-orangePrimary transition-colors">Blog</a></li>
              <li><a href="#faq" className="hover:text-orangePrimary transition-colors">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-white">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-orangePrimary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-orangePrimary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-orangePrimary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-orangePrimary transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} OuroMind Inc. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
