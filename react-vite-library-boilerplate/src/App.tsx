

import ChatBox from "./components/ChatBox";

function App() {
  return (
    <div className="p-8 max-w-4xl mx-auto"> 
      <div className="space-y-8">
        <div> 
          <ChatBox
            apiEndpoint="http://localhost:8000/api/chat"
            title="AI Assistant"
            placeholder="Ask me anything..."
            maxHeight="500px"
          />
        </div>
      
      </div>
    </div>
  );
}

export default App;
