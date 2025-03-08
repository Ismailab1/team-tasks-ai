import React from 'react';
import { Mic, Book, Clock, ArrowUpCircle } from 'lucide-react';

function CheckIn() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Daily Check-In Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900">Daily Check-In (Voice)</h2>
        <div className="flex items-center justify-center mt-2 text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          <span>8:00 PM (Deadline)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {/* AI Interaction Section */}
          <section className="mb-8">
            <h3 className="text-2xl font-bold mb-4">AI Interaction</h3>
            <p className="text-gray-600 mb-6">Engage in a conversation with AI during your daily check-ins.</p>
            
            <div className="space-y-4">
              {/* AI Messages */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Book className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">AI</span>
                    </div>
                    <p className="text-gray-700 mt-1">Hey! How's your day going?</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Book className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">AI</span>
                    </div>
                    <p className="text-gray-700 mt-1">What updates do you have on your project?</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Book className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">AI</span>
                    </div>
                    <p className="text-gray-700 mt-1">Any issues or concerns?</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Voice Check-In Steps */}
          <section>
            <h3 className="text-2xl font-bold mb-4">Voice Check-In Steps</h3>
            <p className="text-gray-600 mb-6">Follow these steps for your daily voice check-in.</p>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-3">
                <Mic className="h-6 w-6 text-gray-600" />
                <span>[Hold to Speak] (User speaks)</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-3">
                <Book className="h-6 w-6 text-gray-600" />
                <span>Speech-to-Text: I'm doing well today!</span>
              </div>
            </div>
          </section>
        </div>

        <div>
          {/* Past Check-Ins */}
          <section className="mb-8">
            <h3 className="text-2xl font-bold mb-4">Past Check-Ins</h3>
            <p className="text-gray-600 mb-4">View your previous check-ins.</p>
            <button className="w-full bg-white p-4 rounded-lg shadow-sm text-left flex items-center justify-between hover:shadow-md transition-shadow">
              <span>Expandable Past Check-Ins</span>
              <ArrowUpCircle className="h-5 w-5 text-gray-600" />
            </button>
          </section>

          {/* AI Summary */}
          <section>
            <h3 className="text-2xl font-bold mb-4">AI Summary</h3>
            <p className="text-gray-600 mb-4">Check out the recent progress overview provided by AI.</p>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="text-sm text-gray-500 mb-2">Progress Overview</h4>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold">87%</span>
                <span className="text-green-500">+3%</span>
              </div>
              <button className="mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                View Summary
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default CheckIn;