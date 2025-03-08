import { Book, Send, History } from "lucide-react";

function Tasks() {
	return (
		<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			{/* Header Section */}
			<div className="bg-gray-800 -mx-4 sm:-mx-6 lg:-mx-8 mb-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="h-12 w-12 bg-gray-700 rounded-full"></div>
							<div>
								<h2 className="text-white font-semibold">AI Assistant</h2>
								<p className="text-gray-400 text-sm">Daily Text Check-In</p>
							</div>
						</div>
						<button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors">
							Start Check-In
						</button>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Today's Check-In Section */}
				<section>
					<h3 className="text-2xl font-bold mb-4">Today's Check-In</h3>
					<p className="text-gray-600 mb-6">
						Engage in a conversation with AI for progress updates and plans
					</p>

					<div className="space-y-4 mb-6">
						<textarea
							className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="Share your thoughts here..."
						/>
						<button className="flex items-center space-x-2 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors">
							<Send className="h-4 w-4" />
							<span>Send</span>
						</button>
					</div>
				</section>

				{/* AI Messages Section */}
				<section className="space-y-4">
					{/* AI Message 1 */}
					<div className="bg-white p-4 rounded-lg shadow-sm">
						<div className="flex items-start space-x-3">
							<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
								<Book className="h-4 w-4 text-blue-600" />
							</div>
							<div>
								<div className="flex items-center space-x-2">
									<span className="font-semibold">AI:</span>
									<span>How's your day going?</span>
								</div>
								<p className="text-gray-500 text-sm mt-1">
									Share your thoughts here
								</p>
							</div>
						</div>
					</div>

					{/* AI Message 2 */}
					<div className="bg-white p-4 rounded-lg shadow-sm">
						<div className="flex items-start space-x-3">
							<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
								<Book className="h-4 w-4 text-blue-600" />
							</div>
							<div>
								<div className="flex items-center space-x-2">
									<span className="font-semibold">AI:</span>
									<span>Any updates on your project?</span>
								</div>
								<p className="text-gray-500 text-sm mt-1">
									Provide project updates
								</p>
							</div>
						</div>
					</div>

					{/* AI Message 3 */}
					<div className="bg-white p-4 rounded-lg shadow-sm">
						<div className="flex items-start space-x-3">
							<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
								<Book className="h-4 w-4 text-blue-600" />
							</div>
							<div>
								<div className="flex items-center space-x-2">
									<span className="font-semibold">AI:</span>
									<span>Do you have any concerns?</span>
								</div>
								<p className="text-gray-500 text-sm mt-1">
									Share any issues you're facing
								</p>
							</div>
						</div>
					</div>
				</section>
			</div>

			{/* Past Check-Ins Section */}
			<section className="mt-12">
				<h3 className="text-2xl font-bold mb-6">Past Check-Ins</h3>
				<div className="space-y-4">
					<button className="w-full bg-white p-4 rounded-lg shadow-sm text-left flex items-center justify-between hover:shadow-md transition-shadow">
						<div className="flex items-center space-x-3">
							<History className="h-5 w-5 text-gray-500" />
							<span>Check-In on 10/25/2021</span>
						</div>
					</button>
					<button className="w-full bg-white p-4 rounded-lg shadow-sm text-left flex items-center justify-between hover:shadow-md transition-shadow">
						<div className="flex items-center space-x-3">
							<History className="h-5 w-5 text-gray-500" />
							<span>Check-In on 10/24/2021</span>
						</div>
					</button>
				</div>
			</section>
		</main>
	);
}

export default Tasks;
