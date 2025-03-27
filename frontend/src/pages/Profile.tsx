import { Github, Mail, Phone } from 'lucide-react';

function Profile() {
  return (
    <main className="bg-gradient-to-r from-gray-50 to-gray-100 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile header with banner */}
        <div className="relative mb-8">
            <div className="h-48 w-full rounded-t-xl bg-gradient-to-r from-blue-500 to-indigo-600 overflow-hidden">
            <img src="https://i.imgur.com/1QFmpkd.jpeg" alt="Profile banner" className="h-full w-full object-cover" />
            </div>
          <div className="absolute -bottom-16 left-8 h-32 w-32 rounded-full ring-4 ring-white bg-white shadow-lg overflow-hidden">
            <img 
              src="https://i.imgur.com/1QFmpkd.jpeg"
              alt="Profile" 
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        
        {/* Main content */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-12">
          {/* Profile info */}
          <div className="px-8 pt-8 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">John Doe</h2>
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-sm font-medium mt-1">
                  Lead Software Engineer <i>@ Insert Team Name</i>
                </span>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                  Edit Profile
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                  Settings
                </button>
              </div>
            </div>
          </div>
          
          <div className="px-8 py-6 border-t border-gray-100">
            {/* About section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                About Me
              </h3>
              <p className="text-gray-700 leading-relaxed">
                I am a passionate software engineer with over 5 years of experience developing web applications 
                using modern technologies. I specialize in building scalable frontend architectures and enjoy 
                solving complex problems while collaborating with cross-functional teams to deliver exceptional 
                user experiences. When I'm not coding, you'll find me hiking or experimenting with new recipes.
              </p>
            </div>
            
            {/* Skills section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {["JavaScript", "TypeScript", "React.js", "Node.js", "Express.js", "Redux", "GraphQL", "AWS", "Docker", "Tailwind CSS"].map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Contact section */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Contact
              </h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail />
                  <span className="text-gray-700"> johndoe@example.com</span>
                </div>
                <div className="flex items-center">
                  <Phone />
                  <span className="text-gray-700"> (123) 456-7890</span>
                </div>
                <div className="flex items-center">
                  <Github />
                  <span className="text-gray-700"> github.com/johndoe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Profile;