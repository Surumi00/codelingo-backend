import { db } from "./index.js";
import { diagnosticQuestions } from "./schema.js";

const questions = [
  // ─────────────────────────────────────────────
  // Beginner Level
  // ─────────────────────────────────────────────

  {
    conceptSlug: "variables-data-types",
    difficulty: "BEGINNER",
    prompt: `What will be the output?

x = "10"
y = 5
print(int(x) + y)`,

    options: [
      "105",
      "15",
      '"15"',
      "Error",
    ],

    correctOptionIndex: 1,

    explanation:
      "The string '10' is converted to an integer using int(x). Then 10 + 5 gives 15.",
  },

  {
    conceptSlug: "operators",
    difficulty: "BEGINNER",
    prompt: `What is the output?

result = 10 + 5 * 2
print(result)`,

    options: [
      "30",
      "20",
      "25",
      "15",
    ],

    correctOptionIndex: 1,

    explanation:
      "Multiplication has higher precedence than addition, so 5 * 2 is evaluated first. The result is 20.",
  },

  {
    conceptSlug: "if-elif-else",
    difficulty: "BEGINNER",
    prompt: `What will this program print?

age = 18
if age > 18:
    print("Adult")
elif age == 18:
    print("Exactly 18")
else:
    print("Minor")`,

    options: [
      "Adult",
      "Exactly 18",
      "Minor",
      "Nothing",
    ],

    correctOptionIndex: 1,

    explanation:
      "age is exactly 18, so the elif condition is true and the program prints 'Exactly 18'.",
  },

  {
    conceptSlug: "loops",
    difficulty: "BEGINNER",
    prompt: `What is the output?

for i in range(1, 5):
    print(i)`,

    options: [
      "1 2 3 4 5",
      "0 1 2 3 4",
      "1 2 3 4",
      "0 1 2 3 4 5",
    ],

    correctOptionIndex: 2,

    explanation:
      "range(1, 5) starts at 1 and stops before 5, so the values are 1, 2, 3, and 4.",
  },

  {
    conceptSlug: "lists",
    difficulty: "BEGINNER",
    prompt: `What will be the value of numbers?

numbers = [1, 2, 3]
numbers.append(4)
print(numbers)`,

    options: [
      "[1, 2, 3]",
      "[4, 1, 2, 3]",
      "[1, 2, 3, 4]",
      "Error",
    ],

    correctOptionIndex: 2,

    explanation:
      "append(4) adds 4 to the end of the list, producing [1, 2, 3, 4].",
  },

  // ─────────────────────────────────────────────
  // Intermediate Level
  // ─────────────────────────────────────────────

  {
    conceptSlug: "oop-classes-constructors",
    difficulty: "INTERMEDIATE",
    prompt: `What will this code print?

class Student:
    def __init__(self, name):
        self.name = name

student = Student("Ravi")
print(student.name)`,

    options: [
      "Student",
      "name",
      "Ravi",
      "Error",
    ],

    correctOptionIndex: 2,

    explanation:
      "The Student object is created with the name 'Ravi'. The name attribute therefore contains 'Ravi'.",
  },

  {
    conceptSlug: "oop-inheritance",
    difficulty: "INTERMEDIATE",
    prompt: `What is the output?

class Animal:
    def speak(self):
        print("Animal sound")

class Dog(Animal):
    pass

dog = Dog()
dog.speak()`,

    options: [
      "Error",
      "Dog",
      "Animal sound",
      "Nothing",
    ],

    correctOptionIndex: 2,

    explanation:
      "Dog inherits from Animal, so the Dog object can use the speak() method defined in Animal.",
  },

  {
    conceptSlug: "recursion",
    difficulty: "INTERMEDIATE",
    prompt: `What will the following function return?

def factorial(n):
    if n == 1:
        return 1
    return n * factorial(n - 1)

print(factorial(4))`,

    options: [
      "10",
      "24",
      "16",
      "Error",
    ],

    correctOptionIndex: 1,

    explanation:
      "factorial(4) calculates 4 × 3 × 2 × 1, which equals 24.",
  },

  {
    conceptSlug: "modules",
    difficulty: "INTERMEDIATE",
    prompt: `What will this code print?

import math
print(math.sqrt(25))`,

    options: [
      "5",
      "5.0",
      "25",
      "Error",
    ],

    correctOptionIndex: 1,

    explanation:
      "math.sqrt(25) returns the square root of 25 as a floating-point value, which is 5.0.",
  },

  {
    conceptSlug: "apis",
    difficulty: "INTERMEDIATE",
    prompt: `Consider:

import requests
response = requests.get("https://example.com")
print(response.status_code)

What does status_code represent?`,

    options: [
      "The website's HTML",
      "The HTTP response status",
      "The URL",
      "The request method",
    ],

    correctOptionIndex: 1,

    explanation:
      "status_code represents the HTTP status returned by the server, such as 200 or 404.",
  },

  // ─────────────────────────────────────────────
  // Advanced Level
  // ─────────────────────────────────────────────

  {
    conceptSlug: "decorators",
    difficulty: "ADVANCED",
    prompt: `What is the purpose of @my_decorator in this code?

@my_decorator
def hello():
    print("Hello")`,

    options: [
      "Creates a class",
      "Modifies or wraps the behavior of hello",
      "Runs hello automatically",
      "Creates a variable",
    ],

    correctOptionIndex: 1,

    explanation:
      "A decorator can modify or wrap the behavior of a function without changing its original definition.",
  },

  {
    conceptSlug: "generators",
    difficulty: "ADVANCED",
    prompt: `What is special about the following function?

def numbers():
    for i in range(3):
        yield i`,

    options: [
      "It returns all values immediately",
      "It creates a generator that produces values lazily",
      "It can only return strings",
      "It runs infinitely",
    ],

    correctOptionIndex: 1,

    explanation:
      "The yield keyword makes this function a generator, which produces values lazily as they are requested.",
  },

  {
    conceptSlug: "concurrency",
    difficulty: "ADVANCED",
    prompt: `What does await generally do inside an async function?`,

    options: [
      "Stops the entire Python program permanently",
      "Waits for an asynchronous operation while allowing other async work to run",
      "Creates a new process",
      "Converts a function into a generator",
    ],

    correctOptionIndex: 1,

    explanation:
      "await pauses the current async operation until the awaited result is available while allowing other asynchronous work to proceed.",
  },

  {
    conceptSlug: "memory-management",
    difficulty: "ADVANCED",
    prompt: `Which statement about Python's garbage collection is correct?`,

    options: [
      "Python never releases unused objects",
      "Python automatically manages memory and can reclaim objects that are no longer reachable",
      "The programmer must manually free every object",
      "del permanently deletes an object from memory in every situation",
    ],

    correctOptionIndex: 1,

    explanation:
      "Python automatically manages memory and can reclaim objects that are no longer reachable.",
  },

  {
    conceptSlug: "type-hinting",
    difficulty: "ADVANCED",
    prompt: `What does the following type hint indicate?

def add(a: int, b: int) -> int:
    return a + b`,

    options: [
      "Python will refuse any non-integer value at runtime",
      "a and b are expected to be integers and the function is expected to return an integer",
      "The function can only be called twice",
      "It converts the arguments to integers",
    ],

    correctOptionIndex: 1,

    explanation:
      "The type hints indicate that a and b are expected to be integers and that the function is expected to return an integer.",
  },

  // ─────────────────────────────────────────────
  // Mixed Diagnostic Questions
  // ─────────────────────────────────────────────

  {
    conceptSlug: "functions",
    difficulty: "INTERMEDIATE",
    prompt: `What is the output?

def calculate(a, b):
    return a * b

result = calculate(4, 5)
print(result)`,

    options: [
      "9",
      "20",
      "45",
      "Error",
    ],

    correctOptionIndex: 1,

    explanation:
      "The calculate function multiplies 4 by 5, producing 20.",
  },

  {
    conceptSlug: "dictionaries",
    difficulty: "INTERMEDIATE",
    prompt: `What will be printed?

student = {
    "name": "Anu",
    "age": 21
}

print(student["name"])`,

    options: [
      "student",
      "name",
      "Anu",
      "Error",
    ],

    correctOptionIndex: 2,

    explanation:
      "The key 'name' maps to the value 'Anu', so student['name'] prints Anu.",
  },

  {
    conceptSlug: "exception-handling",
    difficulty: "INTERMEDIATE",
    prompt: `What will this program print?

try:
    number = int("hello")
except ValueError:
    print("Invalid number")`,

    options: [
      "hello",
      "Invalid number",
      "ValueError",
      "Nothing",
    ],

    correctOptionIndex: 1,

    explanation:
      "int('hello') raises a ValueError, so the except block executes and prints 'Invalid number'.",
  },

  {
    conceptSlug: "context-managers",
    difficulty: "INTERMEDIATE",
    prompt: `Why is with commonly used when working with files?

with open("data.txt", "r") as file:
    data = file.read()`,

    options: [
      "It automatically handles closing the file",
      "It converts the file into JSON",
      "It prevents the file from being read",
      "It makes the file permanent",
    ],

    correctOptionIndex: 0,

    explanation:
      "The with statement automatically handles the cleanup of the file resource, including closing the file.",
  },

  {
    conceptSlug: "polymorphism",
    difficulty: "ADVANCED",
    prompt: `What will this print?

class Dog:
    def speak(self):
        print("Bark")

class Cat:
    def speak(self):
        print("Meow")

for animal in [Dog(), Cat()]:
    animal.speak()`,

    options: [
      "Bark / Bark",
      "Meow / Meow",
      "Bark / Meow",
      "Error",
    ],

    correctOptionIndex: 2,

    explanation:
      "Each object provides its own speak() implementation. Dog prints Bark and Cat prints Meow.",
  },
];

async function seedDiagnostic() {
  try {
    await db.insert(diagnosticQuestions).values(questions);

    console.log(
      `Successfully seeded ${questions.length} diagnostic questions.`,
    );
  } catch (error) {
    console.error("Failed to seed diagnostic questions:", error);
    process.exit(1);
  }
}

seedDiagnostic();