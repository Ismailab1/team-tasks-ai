import { Users, Plus, Link as LinkIcon, User } from "lucide-react";

function Dashboard() {
	return (
		<>
			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="text-center mb-12">
					<h2 className="text-3xl font-bold text-gray-900">Team Dashboard</h2>
					<p className="mt-2 text-gray-600">
						View and manage your teams effectively
					</p>
				</div>

				{/* Teams Section */}
				<section className="mb-12">
					<h3 className="text-2xl font-bold mb-6">Teams</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{/* Team 1 */}
						<div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
							<div className="flex justify-center mb-4">
								<Users className="h-12 w-12 text-blue-600" />
							</div>
							<h4 className="text-lg font-semibold text-center">Team 1</h4>
							<p className="text-sm text-gray-500 text-center mt-1">
								Progress: 80%
							</p>
						</div>
						{/* Team 2 */}
						<div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
							<div className="flex justify-center mb-4">
								<Users className="h-12 w-12 text-blue-600" />
							</div>
							<h4 className="text-lg font-semibold text-center">Team 2</h4>
							<p className="text-sm text-gray-500 text-center mt-1">
								Progress: 50%
							</p>
						</div>
					</div>
				</section>

				{/* Quick Actions */}
				<section>
					<h3 className="text-2xl font-bold mb-6">Quick Actions</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Create New Team */}
						<button className="flex items-center p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
							<div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
								<Plus className="h-6 w-6 text-gray-600" />
							</div>
							<div className="text-left">
								<h4 className="font-semibold">Create New Team</h4>
								<p className="text-sm text-gray-500">
									Start a new team collaboration
								</p>
							</div>
						</button>
						{/* Join Team */}
						<button className="flex items-center p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
							<div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
								<LinkIcon className="h-6 w-6 text-gray-600" />
							</div>
							<div className="text-left">
								<h4 className="font-semibold">Join Team via Code</h4>
								<p className="text-sm text-gray-500">
									Join an existing team using a code
								</p>
							</div>
						</button>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white py-4">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<div className="h-10 w-10 bg-gray-600 rounded-full flex items-center justify-center">
							<User className="h-6 w-6" />
						</div>
						<div>
							<h4 className="font-semibold">John Doe</h4>
							<p className="text-sm text-gray-300">
								Welcome back! Stay productive.
							</p>
						</div>
					</div>
					<div className="flex space-x-3">
						<button className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
							Settings
						</button>
						<button className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
							View Profile
						</button>
					</div>
				</div>
			</footer>
		</>
	);
}

export default Dashboard;
