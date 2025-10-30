from flask import Flask, request, jsonify, session, render_template, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import sys
import io
import contextlib
import json
import requests
import random
import ast

app = Flask(__name__, template_folder='../client', static_folder='../client/static')
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///coding_platform.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# AI API Configuration
GEMINI_API_KEY = "AIzaSyCZymO4VXt42F8HpBBM3NDVInonP73BFTw"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

# Question variety configurations
TOPICS = [
    "arrays", "strings", "linked lists", "stacks", "queues", "trees", "graphs", 
    "dynamic programming", "sorting", "searching", "hash tables", "recursion",
    "binary search", "two pointers", "sliding window", "backtracking"
]

DIFFICULTIES = ["Easy", "Medium", "Hard"]

PROBLEM_TYPES = [
    "find two elements that sum to target",
    "reverse a data structure",
    "find the maximum/minimum element",
    "check if a pattern exists",
    "count occurrences of something",
    "merge two sorted structures",
    "find the longest/shortest subsequence",
    "validate a data structure",
    "implement a specific algorithm",
    "optimize a given solution"
]

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    user_type = db.Column(db.String(20), default='student')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    submissions = db.relationship('Submission', backref='user', lazy=True)

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    input_format = db.Column(db.Text, nullable=False)
    output_format = db.Column(db.Text, nullable=False)
    test_cases = db.Column(db.Text, nullable=False)
    sample_solution = db.Column(db.Text, nullable=True)  # Add this field
    difficulty = db.Column(db.String(20), default='Easy')
    topic = db.Column(db.String(50), default='arrays')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    submissions = db.relationship('Submission', backref='question', lazy=True)

class Submission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)
    code = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False)
    score = db.Column(db.Integer, default=0)
    total_tests = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# AI Question Generation with Variety
def generate_question_with_ai(difficulty=None, topic=None):
    """Generate a coding question using Gemini AI with variety"""
    
    # Add randomness to ensure different questions
    if not difficulty:
        difficulty = random.choice(DIFFICULTIES)
    if not topic:
        topic = random.choice(TOPICS)
    
    problem_type = random.choice(PROBLEM_TYPES)
    
    # Add variety to the prompt
    variety_elements = [
        f"Focus on {problem_type}",
        f"Make it interview-style for {difficulty} level",
        f"Ensure it's different from typical textbook problems",
        f"Add creative constraints or edge cases",
        f"Make the problem practical and realistic"
    ]
    
    selected_variety = random.choice(variety_elements)
    
    headers = {
        'Content-Type': 'application/json',
    }
    
    prompt = f"""Create a unique coding problem with these specifications:
    - Difficulty: {difficulty}
    - Topic: {topic}
    - Style: {selected_variety}
    - Problem Type: {problem_type}
    
    Make this problem UNIQUE and DIFFERENT from common problems. Be creative!
    
    Format as JSON with these exact keys:
    - "title": string (creative, unique title)
    - "description": string (detailed problem with examples, constraints, and explanation)
    - "input_format": string (clear input specification)
    - "output_format": string (clear output specification)  
    - "test_cases": array of 3 objects with "input" and "expected" keys
    - "sample_solution": string (working Python solution that solves the problem)
    
    Requirements:
    1. Make the problem statement engaging and clear
    2. Include realistic constraints
    3. Add at least one example in the description
    4. Ensure test cases cover normal, edge, and boundary cases
    5. Make it interview-appropriate for {difficulty} level
    6. Be creative with the problem scenario
    7. Provide a complete working Python solution
    
    Example structure:
    {{
      "title": "Unique Problem Title",
      "description": "Detailed problem description with context, examples, and constraints...",
      "input_format": "Clear input specification...",
      "output_format": "Clear output specification...",
      "test_cases": [
        {{"input": "test input 1", "expected": "expected output 1"}},
        {{"input": "test input 2", "expected": "expected output 2"}},
        {{"input": "test input 3", "expected": "expected output 3"}}
      ],
      "sample_solution": "def solution():\\n    # Complete working solution\\n    pass"
    }}
    
    Generate a creative {difficulty} {topic} problem now:"""
    
    data = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    }
    
    try:
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers=headers,
            json=data,
            timeout=30
        )
        
        print(f"AI API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            content = result['candidates'][0]['content']['parts'][0]['text']
            print(f"AI Response Content: {content}")
            
            # Extract JSON from the response
            start = content.find('{')
            end = content.rfind('}') + 1
            if start != -1 and end != 0:
                json_str = content[start:end]
                question_data = json.loads(json_str)
                
                # Ensure all required fields are present
                required_fields = ['title', 'description', 'input_format', 'output_format', 'test_cases', 'sample_solution']
                for field in required_fields:
                    if field not in question_data or not question_data[field]:
                        print(f"Missing or empty field: {field}")
                        if field == 'sample_solution':
                            question_data[field] = "# Sample solution not available"
                        else:
                            raise ValueError(f"Missing required field: {field}")
                
                return question_data
        else:
            print(f"AI API Error: {response.text}")
            
    except Exception as e:
        print(f"Error generating question with AI: {e}")
    
    # Enhanced fallback with variety and solutions
    fallback_problems = [
        {
            "title": f"Find Pair Sum in {topic.title()} ({difficulty})",
            "description": f"Given an array of integers, find two numbers that add up to a specific target. This {difficulty.lower()} problem tests your knowledge of {topic} and efficient searching.\n\nConstraints:\n- Array length: 2 to 1000\n- Values: -1000 to 1000\n- Exactly one solution exists\n\nExample:\nInput: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1]\nExplanation: nums[0] + nums[1] = 2 + 7 = 9",
            "input_format": "nums: List[int] - Array of integers\ntarget: int - Target sum",
            "output_format": "List[int] - Indices of the two numbers",
            "test_cases": [
                {"input": "nums = [2, 7, 11, 15]\ntarget = 9", "expected": "[0, 1]"},
                {"input": "nums = [3, 2, 4]\ntarget = 6", "expected": "[1, 2]"},
                {"input": "nums = [3, 3]\ntarget = 6", "expected": "[0, 1]"}
            ],
            "sample_solution": """def solution():
    # Two Sum Problem Solution
    def two_sum(nums, target):
        num_map = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in num_map:
                return [num_map[complement], i]
            num_map[num] = i
        return []
    
    # Test with the given examples
    result = two_sum([2, 7, 11, 15], 9)
    print(result)
    return result"""
        },
        {
            "title": f"Reverse {topic.title()} Problem ({difficulty})",
            "description": f"Implement a function to reverse elements in a {topic[:-1]}. This {difficulty.lower()} problem focuses on {topic} manipulation.\n\nConstraints:\n- Length: 1 to 1000\n- Handle edge cases\n\nExample:\nInput: [1, 2, 3, 4, 5]\nOutput: [5, 4, 3, 2, 1]",
            "input_format": f"data: List - Input {topic[:-1]} to reverse",
            "output_format": f"List - Reversed {topic[:-1]}",
            "test_cases": [
                {"input": "data = [1, 2, 3, 4, 5]", "expected": "[5, 4, 3, 2, 1]"},
                {"input": "data = [1]", "expected": "[1]"},
                {"input": "data = [1, 2]", "expected": "[2, 1]"}
            ],
            "sample_solution": """def solution():
    # Reverse Array Solution
    def reverse_array(data):
        return data[::-1]
    
    # Test with the given examples
    result = reverse_array([1, 2, 3, 4, 5])
    print(result)
    return result"""
        }
    ]
    
    return random.choice(fallback_problems)

# Utility function for safe code execution
def execute_code_safely(code, test_input):
    """Safely execute user code with test input"""
    
    safe_dict = {
        '__builtins__': {
            'len': len, 'range': range, 'enumerate': enumerate, 'zip': zip,
            'map': map, 'filter': filter, 'sorted': sorted, 'sum': sum,
            'max': max, 'min': min, 'abs': abs, 'int': int, 'str': str,
            'list': list, 'dict': dict, 'set': set, 'tuple': tuple,
            'bool': bool, 'print': print, 'True': True, 'False': False, 'None': None,
        }
    }
    
    old_stdout = sys.stdout
    sys.stdout = captured_output = io.StringIO()
    
    try:
        exec(test_input, safe_dict)
        exec(code, safe_dict)
        output = captured_output.getvalue().strip()
        
        if not output:
            for var_name in ['result', 'answer', 'output', 'res']:
                if var_name in safe_dict:
                    output = str(safe_dict[var_name])
                    break
        
        return output
        
    except Exception as e:
        raise Exception(f"Execution error: {str(e)}")
    
    finally:
        sys.stdout = old_stdout

def normalize_output(output):
    """Normalize output for comparison"""
    if not output:
        return ""
    
    # Remove extra whitespace
    output = str(output).strip()
    
    # Try to evaluate as Python literal if it looks like one
    try:
        if output.startswith('[') and output.endswith(']'):
            # It's a list
            import ast
            return str(ast.literal_eval(output))
        elif output.startswith('{') and output.endswith('}'):
            # It's a dict or set
            import ast
            return str(ast.literal_eval(output))
        elif output.lower() in ['true', 'false']:
            # Boolean
            return output.title()
        elif output.isdigit() or (output.startswith('-') and output[1:].isdigit()):
            # Integer
            return output
    except:
        pass
    
    return output

def create_tables():
    """Initialize database tables"""
    db.create_all()
    
    # Add sample questions if none exist
    if Question.query.count() == 0:
        sample_questions = [
            {
                'title': 'Two Sum',
                'description': 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
                'input_format': 'nums = [2,7,11,15], target = 9',
                'output_format': '[0,1]',
                'test_cases': json.dumps([
                    {'input': 'nums = [2,7,11,15]\ntarget = 9', 'expected': '[0, 1]'},
                    {'input': 'nums = [3,2,4]\ntarget = 6', 'expected': '[1, 2]'},
                    {'input': 'nums = [3,3]\ntarget = 6', 'expected': '[0, 1]'}
                ]),
                'difficulty': 'Easy',
                'topic': 'arrays'
            }
        ]
        
        for q_data in sample_questions:
            question = Question(**q_data)
            db.session.add(question)
        
        db.session.commit()

# Initialize database
with app.app_context():
    create_tables()

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('dashboard.html')

@app.route('/dsa')
def dsa():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('dsa.html')

@app.route('/quiz')
def quiz():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('quiz.html')

@app.route('/profile')
def profile():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('profile.html')

# API Routes
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            user_type=data.get('user_type', 'student')
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'message': 'User registered successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if user and check_password_hash(user.password_hash, data['password']):
            session['user_id'] = user.id
            session['username'] = user.username
            session['user_type'] = user.user_type
            return jsonify({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'user_type': user.user_type
                }
            }), 200
        
        return jsonify({'error': 'Invalid credentials'}), 401
        
    except Exception as e:
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/status')
def status():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        return jsonify({
            'authenticated': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'user_type': user.user_type
            }
        })
    return jsonify({'authenticated': False})

@app.route('/api/stats')
def stats():
    total_users = User.query.count()
    total_questions = Question.query.count()
    total_submissions = Submission.query.count()
    
    return jsonify({
        'total_users': total_users,
        'total_questions': total_questions,
        'total_submissions': total_submissions
    })

@app.route('/api/questions')
def get_questions():
    questions = Question.query.order_by(Question.created_at.desc()).all()
    return jsonify([{
        'id': q.id,
        'title': q.title,
        'description': q.description,
        'input_format': q.input_format,
        'output_format': q.output_format,
        'difficulty': q.difficulty,
        'topic': q.topic
    } for q in questions])

@app.route('/api/questions/<int:question_id>')
def get_question(question_id):
    question = Question.query.get_or_404(question_id)
    return jsonify({
        'id': question.id,
        'title': question.title,
        'description': question.description,
        'input_format': question.input_format,
        'output_format': question.output_format,
        'difficulty': question.difficulty,
        'topic': question.topic,
        'test_cases': question.test_cases,
        'sample_solution': question.sample_solution
    })

@app.route('/api/generate-question', methods=['POST'])
def generate_question():
    """Generate a new question using AI with variety"""
    try:
        data = request.get_json() or {}
        
        # Add randomness to parameters
        difficulty = data.get('difficulty') or random.choice(DIFFICULTIES)
        topic = data.get('topic') or random.choice(TOPICS)
        
        print(f"Generating question: difficulty={difficulty}, topic={topic}")
        
        # Generate question using AI with variety
        question_data = generate_question_with_ai(difficulty, topic)
        
        # Save to database
        question = Question(
            title=question_data['title'],
            description=question_data['description'],
            input_format=question_data['input_format'],
            output_format=question_data['output_format'],
            test_cases=json.dumps(question_data['test_cases']),
            sample_solution=question_data.get('sample_solution', '# No solution available'),
            difficulty=difficulty,
            topic=topic
        )
        
        db.session.add(question)
        db.session.commit()
        
        print(f"Question generated successfully: {question.title}")
        
        return jsonify({
            'success': True,
            'message': 'Question generated successfully',
            'question': {
                'id': question.id,
                'title': question.title,
                'description': question.description,
                'difficulty': question.difficulty,
                'topic': question.topic
            }
        }), 201
        
    except Exception as e:
        print(f"Error generating question: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate question'
        }), 500

@app.route('/api/submit/<int:question_id>', methods=['POST'])
def submit_solution(question_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        code = data.get('code', '')
        
        question = Question.query.get_or_404(question_id)
        test_cases = json.loads(question.test_cases)
        
        results = []
        passed = 0
        
        for test_case in test_cases:
            try:
                result = execute_code_safely(code, test_case['input'])
                expected = test_case['expected']
                
                # Normalize both outputs for comparison
                normalized_result = normalize_output(result)
                normalized_expected = normalize_output(expected)
                
                is_correct = normalized_result == normalized_expected
                
                results.append({
                    'input': test_case['input'],
                    'expected': expected,
                    'actual': str(result),
                    'passed': is_correct
                })
                
                if is_correct:
                    passed += 1
                    
            except Exception as e:
                results.append({
                    'input': test_case['input'],
                    'expected': test_case['expected'],
                    'actual': f'Error: {str(e)}',
                    'passed': False
                })
        
        status = 'Passed' if passed == len(test_cases) else 'Failed'
        
        submission = Submission(
            user_id=session['user_id'],
            question_id=question_id,
            code=code,
            status=status,
            score=passed,
            total_tests=len(test_cases)
        )
        
        db.session.add(submission)
        db.session.commit()
        
        return jsonify({
            'status': status,
            'passed': passed,
            'total': len(test_cases),
            'results': results
        })
        
    except Exception as e:
        return jsonify({'error': 'Submission failed'}), 500

@app.route('/api/submissions')
def get_submissions():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    submissions = Submission.query.filter_by(user_id=session['user_id']).order_by(Submission.created_at.desc()).all()
    
    return jsonify([{
        'id': s.id,
        'question_title': s.question.title,
        'status': s.status,
        'score': s.score,
        'total_tests': s.total_tests,
        'created_at': s.created_at.isoformat()
    } for s in submissions])

if __name__ == '__main__':
    app.run(debug=True)
