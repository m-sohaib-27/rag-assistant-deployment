# Quick Fix for Jupyter Timeout Issues
# Add this cell to your Jupyter notebook

import requests
import time
import json

class RAGClient:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        
    def submit_query(self, question):
        """Submit query for async processing"""
        url = f"{self.base_url}/api/async-queries/submit"
        try:
            response = requests.post(url, json={"question": question}, timeout=30)
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}: {response.text}"}
        except Exception as e:
            return {"error": str(e)}
    
    def check_status(self, query_id):
        """Check query processing status"""
        url = f"{self.base_url}/api/async-queries/status/{query_id}"
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}: {response.text}"}
        except Exception as e:
            return {"error": str(e)}
    
    def wait_for_result(self, query_id, max_wait=300):
        """Poll for query result"""
        start_time = time.time()
        print(f"Waiting for query {query_id}...")
        
        while time.time() - start_time < max_wait:
            result = self.check_status(query_id)
            
            if 'error' in result:
                return result
                
            status = result.get('status')
            
            if status == 'completed':
                return result
            elif status == 'error':
                return {"error": result.get('error', 'Unknown error')}
            else:
                progress = result.get('progress', 'Processing')
                print(f"Status: {progress}")
                time.sleep(3)  # Wait 3 seconds before checking again
        
        return {"error": "Query timed out after waiting"}
    
    def ask_question(self, question, max_wait=300):
        """Complete workflow: submit and wait for result"""
        print(f"Question: {question}")
        print("=" * 50)
        
        # Submit query
        submit_result = self.submit_query(question)
        if 'error' in submit_result:
            return submit_result
        
        query_id = submit_result['queryId']
        print(f"Query submitted with ID: {query_id}")
        
        # Wait for result
        result = self.wait_for_result(query_id, max_wait)
        
        if 'error' in result:
            print(f"Error: {result['error']}")
            return result
        
        # Display result
        print(f"\n✅ Answer: {result['answer']}")
        if 'sources' in result and result['sources']:
            print(f"\n📚 Sources: {len(result['sources'])} document(s)")
            for i, source in enumerate(result['sources'][:3], 1):  # Show first 3 sources
                print(f"  {i}. {source.get('document_name', 'Unknown document')}")
        
        if 'confidence' in result:
            print(f"\n🎯 Confidence: {result['confidence']:.2f}")
        
        return result

# Usage Examples:

# 1. Quick test
rag = RAGClient()

# Test server connection
print("Testing server connection...")
response = requests.get("http://localhost:5000/api/health")
if response.status_code == 200:
    print("✅ Server is running")
else:
    print("❌ Server not responding")

# 2. Ask a question
question = "What is this document about?"
result = rag.ask_question(question)

# 3. Check server stats
stats_response = requests.get("http://localhost:5000/api/stats")
if stats_response.status_code == 200:
    stats = stats_response.json()
    print(f"\nServer Stats:")
    print(f"Documents: {stats.get('totalDocuments', 0)}")
    print(f"Processed: {stats.get('processedDocuments', 0)}")
    print(f"Queries: {stats.get('totalQueries', 0)}")

# 4. Manual timeout fix for existing endpoints
def query_with_timeout(question, timeout=120):
    """Direct query with longer timeout"""
    try:
        response = requests.post(
            "http://localhost:5000/api/queries",
            json={"question": question},
            timeout=timeout
        )
        return response.json()
    except requests.exceptions.Timeout:
        return {"error": f"Request timed out after {timeout} seconds"}
    except Exception as e:
        return {"error": str(e)}

# Use this if async method doesn't work:
# result = query_with_timeout("Your question here", timeout=180)
# print(result)