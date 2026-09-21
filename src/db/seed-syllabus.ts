import { db } from "./index.js";
import {
  syllabusConcepts,
  syllabusLevels,
  syllabusTopics,
} from "./schema.js";
import { and, eq } from "drizzle-orm";

// ─────────────────────────────────────────────
// Python Syllabus
// ─────────────────────────────────────────────

const syllabus = [
  {
    order: 1,
    title: "Beginner",
    description: "Absolute fundamentals of Python programming.",
    topics: [
      {
        order: 1,
        title: "Python Basics",
        blurb:
          "Learn the basic syntax, tools, variables, and data types needed to start programming in Python.",
        concepts: [
          {
            title: "Installing Python and IDEs",
            description:
              "Learn how to install Python and understand common development environments such as VS Code, PyCharm, and Jupyter.",
            slug: "installing-python-and-ides",
          },
          {
            title: "print(), input(), and comments",
            description:
              "Learn how to display output, receive user input, and write comments in Python.",
            slug: "print-input-and-comments",
          },
          {
            title: "Variables",
            description:
              "Learn how variables store and reference values in Python.",
            slug: "variables",
          },
          {
            title: "int, float, str, and bool",
            description:
              "Understand Python's fundamental integer, floating-point, string, and Boolean data types.",
            slug: "python-basic-data-types",
          },
          {
            title: "Type Casting",
            description:
              "Learn how to convert values from one data type to another.",
            slug: "type-casting",
          },
        ],
      },

      {
        order: 2,
        title: "Operators",
        blurb:
          "Learn how to perform calculations, comparisons, assignments, and logical operations.",
        concepts: [
          {
            title: "Arithmetic Operators",
            description:
              "Learn operators used for mathematical calculations such as addition, subtraction, multiplication, division, and modulus.",
            slug: "arithmetic-operators",
          },
          {
            title: "Comparison Operators",
            description:
              "Learn how to compare values using operators such as ==, !=, >, <, >=, and <=.",
            slug: "comparison-operators",
          },
          {
            title: "Assignment Operators",
            description:
              "Learn how to assign and update values using assignment operators.",
            slug: "assignment-operators",
          },
          {
            title: "Logical Operators",
            description:
              "Learn how to combine and evaluate conditions using and, or, and not.",
            slug: "logical-operators",
          },
          {
            title: "Operator Precedence",
            description:
              "Understand the order in which Python evaluates different operators.",
            slug: "operator-precedence",
          },
        ],
      },

      {
        order: 3,
        title: "Control Flow",
        blurb:
          "Learn how to control the execution of Python programs using conditions and loops.",
        concepts: [
          {
            title: "if, elif, and else",
            description:
              "Learn how to execute different blocks of code based on conditions.",
            slug: "control-flow",
          },
          {
            title: "while Loops",
            description:
              "Learn how to repeatedly execute code while a condition remains true.",
            slug: "while-loops",
          },
          {
            title: "for Loops",
            description:
              "Learn how to iterate over sequences and other iterable objects.",
            slug: "for-loops",
          },
          {
            title: "break, continue, and pass",
            description:
              "Learn how to control loop execution using break, continue, and pass.",
            slug: "break-continue-and-pass",
          },
          {
            title: "range()",
            description:
              "Learn how to generate sequences of numbers using the range() function.",
            slug: "range-function",
          },
        ],
      },

      {
        order: 4,
        title: "Strings",
        blurb:
          "Learn how to work with text, string indexing, slicing, and common string operations.",
        concepts: [
          {
            title: "String Basics",
            description:
              "Learn how strings are created and represented in Python.",
            slug: "string-basics",
          },
          {
            title: "Indexing and Slicing",
            description:
              "Learn how to access individual characters and portions of strings.",
            slug: "string-indexing-and-slicing",
          },
          {
            title: "Common String Methods",
            description:
              "Learn commonly used methods for modifying and inspecting strings.",
            slug: "string-methods",
          },
        ],
      },

      {
        order: 5,
        title: "Functions — Basics",
        blurb:
          "Learn the fundamentals of creating reusable blocks of Python code.",
        concepts: [
          {
            title: "Defining Functions",
            description:
              "Learn how to create reusable functions using the def keyword.",
            slug: "functions",
          },
          {
            title: "Parameters",
            description:
              "Learn how functions receive input through parameters.",
            slug: "function-parameters",
          },
          {
            title: "Return Values",
            description:
              "Learn how functions return results using the return statement.",
            slug: "function-return-values",
          },
        ],
      },

      {
        order: 6,
        title: "Error Handling — Introduction",
        blurb:
          "Learn the basics of handling errors and exceptions in Python programs.",
        concepts: [
          {
            title: "try",
            description:
              "Learn how to place code that may produce an exception inside a try block.",
            slug: "try-block",
          },
          {
            title: "except",
            description:
              "Learn how to catch and handle exceptions using except.",
            slug: "except-block",
          },
          {
            title: "finally",
            description:
              "Learn how to execute cleanup code using finally.",
            slug: "finally-block",
          },
          {
            title: "Common Built-in Exceptions",
            description:
              "Learn about common Python exceptions such as ValueError, TypeError, and IndexError.",
            slug: "common-built-in-exceptions",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // Elementary
  // ─────────────────────────────────────────────

  {
    order: 2,
    title: "Elementary",
    description: "Build programming ability and start creating useful programs.",
    topics: [
      {
        order: 1,
        title: "Data Structures",
        blurb:
          "Learn Python's core collection types and how to work with groups of data.",
        concepts: [
          {
            title: "Lists",
            description:
              "Learn how to create, access, modify, and iterate over Python lists.",
            slug: "data-structures",
          },
          {
            title: "List Methods",
            description:
              "Learn commonly used list methods such as append, remove, sort, and extend.",
            slug: "list-methods",
          },
          {
            title: "Tuples",
            description:
              "Learn how to create and use immutable sequences with tuples.",
            slug: "tuples",
          },
          {
            title: "Sets",
            description:
              "Learn how sets store unique values and support set operations.",
            slug: "sets",
          },
          {
            title: "Dictionaries",
            description:
              "Learn how dictionaries store data as key-value pairs.",
            slug: "dictionaries",
          },
          {
            title: "Basic Operations on Collections",
            description:
              "Learn common operations for accessing, modifying, searching, and iterating over collections.",
            slug: "basic-collection-operations",
          },
        ],
      },

      {
        order: 2,
        title: "Functions — Intermediate",
        blurb:
          "Extend your understanding of functions with flexible arguments, scope, and lambda expressions.",
        concepts: [
          {
            title: "Default Arguments",
            description:
              "Learn how to provide default values for function parameters.",
            slug: "default-arguments",
          },
          {
            title: "Keyword Arguments",
            description:
              "Learn how to pass function arguments using parameter names.",
            slug: "keyword-arguments",
          },
          {
            title: "*args",
            description:
              "Learn how to accept a variable number of positional arguments.",
            slug: "args",
          },
          {
            title: "**kwargs",
            description:
              "Learn how to accept a variable number of keyword arguments.",
            slug: "kwargs",
          },
          {
            title: "Local vs Global Scope",
            description:
              "Understand variable scope and the difference between local and global variables.",
            slug: "local-vs-global-scope",
          },
          {
            title: "Lambda Functions",
            description:
              "Learn how to create small anonymous functions using lambda.",
            slug: "lambda-functions",
          },
        ],
      },

      {
        order: 3,
        title: "File Handling — Basic",
        blurb:
          "Learn how to read from and write to text files safely.",
        concepts: [
          {
            title: "Reading Text Files",
            description:
              "Learn how to open and read text files in Python.",
            slug: "reading-text-files",
          },
          {
            title: "Writing Text Files",
            description:
              "Learn how to create and write data to text files.",
            slug: "writing-text-files",
          },
          {
            title: "with Statement",
            description:
              "Learn how the with statement automatically manages file resources.",
            slug: "with-statement",
          },
        ],
      },

      {
        order: 4,
        title: "Modules & Packages — Basics",
        blurb:
          "Learn how to organize Python code into reusable modules and packages.",
        concepts: [
          {
            title: "Importing Modules",
            description:
              "Learn how to import and use functionality from Python modules.",
            slug: "importing-modules",
          },
          {
            title: "Creating Custom Modules",
            description:
              "Learn how to create your own reusable Python modules.",
            slug: "creating-custom-modules",
          },
          {
            title: "__init__.py",
            description:
              "Understand the role of __init__.py in Python packages.",
            slug: "init-py",
          },
          {
            title: "Basic Package Structure",
            description:
              "Learn how Python packages organize related modules.",
            slug: "basic-package-structure",
          },
        ],
      },

      {
        order: 5,
        title: "Virtual Environments & Package Management",
        blurb:
          "Learn how to isolate Python projects and manage external dependencies.",
        concepts: [
          {
            title: "venv",
            description:
              "Learn how to create and use isolated Python virtual environments.",
            slug: "venv",
          },
          {
            title: "pip",
            description:
              "Learn how to install and manage Python packages using pip.",
            slug: "pip",
          },
          {
            title: "requirements.txt",
            description:
              "Learn how to define and share project dependencies using requirements.txt.",
            slug: "requirements-txt",
          },
        ],
      },

      {
        order: 6,
        title: "Regular Expressions — Basics",
        blurb:
          "Learn the fundamentals of pattern matching and text processing with regular expressions.",
        concepts: [
          {
            title: "re Module",
            description:
              "Learn how to use Python's built-in re module for regular expressions.",
            slug: "re-module",
          },
          {
            title: "Basic Pattern Matching",
            description:
              "Learn how to search for patterns in text using regular expressions.",
            slug: "basic-pattern-matching",
          },
          {
            title: "Groups",
            description:
              "Learn how to capture and work with groups in regular expressions.",
            slug: "regex-groups",
          },
          {
            title: "Substitution",
            description:
              "Learn how to replace matching text using regular expressions.",
            slug: "regex-substitution",
          },
        ],
      },

      {
        order: 7,
        title: "Testing — Introduction",
        blurb:
          "Learn the fundamentals of checking Python programs with automated tests.",
        concepts: [
          {
            title: "Assertions",
            description:
              "Learn how assertions can be used to verify expected program behavior.",
            slug: "assertions",
          },
          {
            title: "Basic unittest",
            description:
              "Learn the basics of Python's unittest framework.",
            slug: "basic-unittest",
          },
          {
            title: "Basic pytest",
            description:
              "Learn the fundamentals of writing tests using pytest.",
            slug: "basic-pytest",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // Intermediate
  // ─────────────────────────────────────────────

  {
    order: 3,
    title: "Intermediate",
    description:
      "Learn real-world Python development and build practical applications.",
    topics: [
      {
        order: 1,
        title: "Object-Oriented Programming",
        blurb:
          "Learn how to design Python programs using classes, objects, and object-oriented principles.",
        concepts: [
          {
            title: "Classes and Objects",
            description:
              "Learn how to define classes and create objects in Python.",
            slug: "oop",
          },
          {
            title: "Constructors (__init__)",
            description:
              "Learn how the __init__ method initializes newly created objects.",
            slug: "constructors-init",
          },
          {
            title: "Instance vs Class Variables",
            description:
              "Understand the difference between instance-level and class-level data.",
            slug: "instance-vs-class-variables",
          },
          {
            title: "Inheritance",
            description:
              "Learn how classes can inherit behavior and attributes from other classes.",
            slug: "inheritance",
          },
          {
            title: "Multiple Inheritance",
            description:
              "Learn how a Python class can inherit from multiple parent classes.",
            slug: "multiple-inheritance",
          },
          {
            title: "Polymorphism",
            description:
              "Learn how different objects can respond to the same interface or operation.",
            slug: "polymorphism",
          },
          {
            title: "Encapsulation",
            description:
              "Learn how Python classes organize and control access to their data and behavior.",
            slug: "encapsulation",
          },
          {
            title: "Abstraction",
            description:
              "Learn how to expose essential behavior while hiding implementation details.",
            slug: "abstraction",
          },
          {
            title: "Magic / Dunder Methods",
            description:
              "Learn how special methods such as __str__, __repr__, and __eq__ customize object behavior.",
            slug: "magic-dunder-methods",
          },
        ],
      },

      {
        order: 2,
        title: "Advanced Functions",
        blurb:
          "Learn powerful function techniques used in real Python applications.",
        concepts: [
          {
            title: "Recursion",
            description:
              "Learn how functions can call themselves to solve recursive problems.",
            slug: "recursion",
          },
          {
            title: "Closures",
            description:
              "Learn how inner functions can retain access to variables from their enclosing scope.",
            slug: "closures",
          },
          {
            title: "Decorators",
            description:
              "Learn how decorators modify or extend the behavior of functions.",
            slug: "decorators",
          },
          {
            title: "Generators and yield",
            description:
              "Learn how generators produce values lazily using yield.",
            slug: "generators-and-yield",
          },
          {
            title: "map()",
            description:
              "Learn how map() applies a function to items in an iterable.",
            slug: "map-function",
          },
          {
            title: "filter()",
            description:
              "Learn how filter() selects items from an iterable based on a condition.",
            slug: "filter-function",
          },
          {
            title: "reduce()",
            description:
              "Learn how reduce() combines iterable values into a single result.",
            slug: "reduce-function",
          },
        ],
      },

      {
        order: 3,
        title: "Advanced Exception Handling",
        blurb:
          "Learn how to design and manage more advanced exception handling systems.",
        concepts: [
          {
            title: "Custom Exceptions",
            description:
              "Learn how to create application-specific exception classes.",
            slug: "custom-exceptions",
          },
          {
            title: "Raising Exceptions",
            description:
              "Learn how to explicitly raise exceptions using raise.",
            slug: "raising-exceptions",
          },
          {
            title: "Exception Chaining",
            description:
              "Learn how Python connects related exceptions using exception chaining.",
            slug: "exception-chaining",
          },
        ],
      },

      {
        order: 4,
        title: "Advanced File Handling",
        blurb:
          "Learn how to work with structured files, binary data, and custom context managers.",
        concepts: [
          {
            title: "CSV",
            description:
              "Learn how to read and write comma-separated value files.",
            slug: "csv-files",
          },
          {
            title: "JSON",
            description:
              "Learn how to work with JSON data in Python.",
            slug: "json-files",
          },
          {
            title: "Binary Files",
            description:
              "Learn how to read and write binary file data.",
            slug: "binary-files",
          },
          {
            title: "Custom Context Managers",
            description:
              "Learn how to create custom context managers for resource management.",
            slug: "custom-context-managers",
          },
          {
            title: "__enter__ and __exit__",
            description:
              "Learn how __enter__ and __exit__ implement custom context manager behavior.",
            slug: "enter-and-exit",
          },
        ],
      },

      {
        order: 5,
        title: "Working with APIs & Databases",
        blurb:
          "Learn how Python applications communicate with APIs and databases.",
        concepts: [
          {
            title: "requests",
            description:
              "Learn how to use the requests library for HTTP communication.",
            slug: "requests",
          },
          {
            title: "API Calls",
            description:
              "Learn how Python applications consume web APIs.",
            slug: "api-calls",
          },
          {
            title: "SQLite / sqlite3",
            description:
              "Learn how to work with SQLite databases using Python's sqlite3 module.",
            slug: "sqlite-sqlite3",
          },
          {
            title: "Basic ORM Concepts",
            description:
              "Understand how Object-Relational Mapping connects application objects with database records.",
            slug: "basic-orm-concepts",
          },
          {
            title: "SQLAlchemy Introduction",
            description:
              "Learn the basics of using SQLAlchemy as a Python ORM.",
            slug: "sqlalchemy-introduction",
          },
        ],
      },

      {
        order: 6,
        title: "Standard Library",
        blurb:
          "Learn commonly used modules from Python's standard library.",
        concepts: [
          {
            title: "os",
            description:
              "Learn how to interact with the operating system using the os module.",
            slug: "os-module",
          },
          {
            title: "sys",
            description:
              "Learn how to interact with the Python runtime using the sys module.",
            slug: "sys-module",
          },
          {
            title: "math",
            description:
              "Learn mathematical functions provided by the math module.",
            slug: "math-module",
          },
          {
            title: "random",
            description:
              "Learn how to generate random values using the random module.",
            slug: "random-module",
          },
          {
            title: "datetime",
            description:
              "Learn how to work with dates and times using the datetime module.",
            slug: "datetime-module",
          },
          {
            title: "collections",
            description:
              "Learn specialized collection types from the collections module.",
            slug: "collections-module",
          },
          {
            title: "itertools",
            description:
              "Learn tools for efficient iteration and combinatorial operations.",
            slug: "itertools-module",
          },
        ],
      },

      {
        order: 7,
        title: "Testing & Debugging — Intermediate",
        blurb:
          "Improve testing practices and learn the basics of debugging and logging.",
        concepts: [
          {
            title: "Better pytest Usage",
            description:
              "Learn more practical pytest techniques for testing Python applications.",
            slug: "better-pytest-usage",
          },
          {
            title: "Debugging Concepts",
            description:
              "Learn how to identify, investigate, and fix problems in Python programs.",
            slug: "debugging-concepts",
          },
          {
            title: "Logging Basics",
            description:
              "Learn how to record useful runtime information using Python logging.",
            slug: "logging-basics",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // Advanced
  // ─────────────────────────────────────────────

  {
    order: 4,
    title: "Advanced",
    description:
      "Professional Python concepts, architecture, performance, deployment, and specialized domains.",
    topics: [
      {
        order: 1,
        title: "Advanced OOP",
        blurb:
          "Explore advanced object-oriented programming and reusable design patterns.",
        concepts: [
          {
            title: "Metaclasses",
            description:
              "Learn how metaclasses control the creation and behavior of classes.",
            slug: "metaclasses",
          },
          {
            title: "Abstract Base Classes",
            description:
              "Learn how abstract base classes define interfaces and required behavior.",
            slug: "abstract-base-classes",
          },
          {
            title: "@property",
            description:
              "Learn how the property decorator creates managed attributes.",
            slug: "property-decorator",
          },
          {
            title: "Setters and Getters",
            description:
              "Learn how to control access to object attributes using properties.",
            slug: "setters-and-getters",
          },
          {
            title: "Design Patterns",
            description:
              "Understand reusable solutions to common software design problems.",
            slug: "design-patterns",
          },
          {
            title: "Singleton",
            description:
              "Learn the Singleton design pattern and its use cases.",
            slug: "singleton-pattern",
          },
          {
            title: "Factory",
            description:
              "Learn the Factory design pattern for creating objects.",
            slug: "factory-pattern",
          },
          {
            title: "Observer",
            description:
              "Learn the Observer design pattern for event-driven communication.",
            slug: "observer-pattern",
          },
        ],
      },

      {
        order: 2,
        title: "Advanced Iterators & Generators",
        blurb:
          "Learn how Python iteration works internally and build custom iterators and coroutines.",
        concepts: [
          {
            title: "Custom Iterators",
            description:
              "Learn how to create custom objects that can be iterated over.",
            slug: "custom-iterators",
          },
          {
            title: "__iter__",
            description:
              "Learn how __iter__ makes an object iterable.",
            slug: "iter-method",
          },
          {
            title: "__next__",
            description:
              "Learn how __next__ controls retrieval of the next value from an iterator.",
            slug: "next-method",
          },
          {
            title: "Generator Expressions",
            description:
              "Learn how to create generators using compact generator expressions.",
            slug: "generator-expressions",
          },
          {
            title: "Advanced itertools",
            description:
              "Explore advanced iteration utilities from itertools.",
            slug: "advanced-itertools",
          },
          {
            title: "Coroutines",
            description:
              "Learn how coroutines can pause and resume execution.",
            slug: "coroutines",
          },
        ],
      },

      {
        order: 3,
        title: "Advanced Decorators & Metaprogramming",
        blurb:
          "Explore advanced techniques for dynamically modifying and inspecting Python objects and code.",
        concepts: [
          {
            title: "Decorators with Arguments",
            description:
              "Learn how to create decorators that accept their own arguments.",
            slug: "decorators-with-arguments",
          },
          {
            title: "Class Decorators",
            description:
              "Learn how decorators can modify or enhance classes.",
            slug: "class-decorators",
          },
          {
            title: "__getattr__",
            description:
              "Learn how __getattr__ handles access to missing attributes.",
            slug: "getattr",
          },
          {
            title: "__setattr__",
            description:
              "Learn how __setattr__ controls attribute assignment.",
            slug: "setattr",
          },
          {
            title: "Descriptors",
            description:
              "Learn how descriptors customize attribute access behavior.",
            slug: "descriptors",
          },
          {
            title: "eval()",
            description:
              "Learn how eval() dynamically evaluates Python expressions.",
            slug: "eval",
          },
          {
            title: "exec()",
            description:
              "Learn how exec() dynamically executes Python code.",
            slug: "exec",
          },
        ],
      },

      {
        order: 4,
        title: "Concurrency & Parallelism",
        blurb:
          "Learn how Python programs perform multiple tasks concurrently or in parallel.",
        concepts: [
          {
            title: "Threading",
            description:
              "Learn how to run multiple threads within a Python process.",
            slug: "threading",
          },
          {
            title: "Multiprocessing",
            description:
              "Learn how to use multiple processes for parallel computation.",
            slug: "multiprocessing",
          },
          {
            title: "asyncio",
            description:
              "Learn Python's framework for asynchronous programming.",
            slug: "asyncio",
          },
          {
            title: "async / await",
            description:
              "Learn how async and await are used to write asynchronous Python code.",
            slug: "async-await",
          },
          {
            title: "GIL",
            description:
              "Understand Python's Global Interpreter Lock and its impact on concurrency.",
            slug: "global-interpreter-lock",
          },
        ],
      },

      {
        order: 5,
        title: "Memory Management & Performance",
        blurb:
          "Learn how Python manages memory and how to improve application performance.",
        concepts: [
          {
            title: "Garbage Collection",
            description:
              "Learn how Python automatically manages and reclaims memory.",
            slug: "garbage-collection",
          },
          {
            title: "Memory Profiling",
            description:
              "Learn techniques for measuring and investigating memory usage.",
            slug: "memory-profiling",
          },
          {
            title: "Time Complexity",
            description:
              "Learn how to analyze the time requirements of algorithms.",
            slug: "time-complexity",
          },
          {
            title: "Space Complexity",
            description:
              "Learn how to analyze the memory requirements of algorithms.",
            slug: "space-complexity",
          },
          {
            title: "Performance Optimization",
            description:
              "Learn techniques for identifying and reducing performance bottlenecks.",
            slug: "performance-optimization",
          },
          {
            title: "Cython Basics",
            description:
              "Learn how Cython can improve Python performance by compiling Python-like code.",
            slug: "cython-basics",
          },
        ],
      },

      {
        order: 6,
        title: "Networking & Web Development",
        blurb:
          "Learn networking fundamentals and Python technologies for building web applications.",
        concepts: [
          {
            title: "Socket Programming",
            description:
              "Learn how applications communicate over networks using sockets.",
            slug: "socket-programming",
          },
          {
            title: "Flask",
            description:
              "Learn the fundamentals of building web applications with Flask.",
            slug: "flask",
          },
          {
            title: "Django",
            description:
              "Learn the fundamentals of building web applications with Django.",
            slug: "django",
          },
          {
            title: "FastAPI",
            description:
              "Learn the fundamentals of building APIs using FastAPI.",
            slug: "fastapi",
          },
          {
            title: "REST API Design",
            description:
              "Learn principles for designing RESTful APIs.",
            slug: "rest-api-design",
          },
          {
            title: "WebSockets",
            description:
              "Learn how WebSockets enable real-time two-way communication.",
            slug: "websockets",
          },
        ],
      },

      {
        order: 7,
        title: "Data Handling & Analysis",
        blurb:
          "Learn Python tools for numerical computing, data analysis, and visualization.",
        concepts: [
          {
            title: "NumPy",
            description:
              "Learn the fundamentals of numerical computing with NumPy.",
            slug: "numpy",
          },
          {
            title: "Pandas",
            description:
              "Learn how to manipulate and analyze structured data with Pandas.",
            slug: "pandas",
          },
          {
            title: "Matplotlib",
            description:
              "Learn how to create data visualizations using Matplotlib.",
            slug: "matplotlib",
          },
          {
            title: "Seaborn",
            description:
              "Learn how to create statistical visualizations using Seaborn.",
            slug: "seaborn",
          },
          {
            title: "Large Datasets",
            description:
              "Learn approaches for working efficiently with large datasets.",
            slug: "large-datasets",
          },
        ],
      },

      {
        order: 8,
        title: "Advanced Testing & Debugging",
        blurb:
          "Learn professional testing, debugging, and diagnostic techniques.",
        concepts: [
          {
            title: "pytest Fixtures",
            description:
              "Learn how pytest fixtures provide reusable test setup and resources.",
            slug: "pytest-fixtures",
          },
          {
            title: "Mocking",
            description:
              "Learn how mocking isolates parts of an application during testing.",
            slug: "mocking",
          },
          {
            title: "TDD",
            description:
              "Learn the fundamentals of Test-Driven Development.",
            slug: "test-driven-development",
          },
          {
            title: "pdb",
            description:
              "Learn how to debug Python programs using the Python debugger.",
            slug: "pdb",
          },
          {
            title: "Advanced Logging",
            description:
              "Learn professional logging techniques for Python applications.",
            slug: "advanced-logging",
          },
        ],
      },

      {
        order: 9,
        title: "Packaging & Deployment",
        blurb:
          "Learn how to package, distribute, containerize, and deploy Python applications.",
        concepts: [
          {
            title: "setuptools",
            description:
              "Learn how setuptools is used to build and package Python projects.",
            slug: "setuptools",
          },
          {
            title: "pyproject.toml",
            description:
              "Learn how pyproject.toml defines Python project configuration and build settings.",
            slug: "pyproject-toml",
          },
          {
            title: "Publishing to PyPI",
            description:
              "Learn the basics of distributing Python packages through PyPI.",
            slug: "publishing-to-pypi",
          },
          {
            title: "Dockerizing Python Applications",
            description:
              "Learn how to package Python applications into Docker containers.",
            slug: "dockerizing-python-applications",
          },
          {
            title: "CI/CD",
            description:
              "Learn the fundamentals of continuous integration and continuous delivery for Python projects.",
            slug: "ci-cd",
          },
        ],
      },

      {
        order: 10,
        title: "Design & Architecture",
        blurb:
          "Learn principles for writing maintainable, scalable, and well-structured Python software.",
        concepts: [
          {
            title: "SOLID Principles",
            description:
              "Learn the five SOLID principles for designing maintainable software.",
            slug: "solid-principles",
          },
          {
            title: "Clean Code",
            description:
              "Learn practices for writing readable, maintainable, and reliable code.",
            slug: "clean-code",
          },
          {
            title: "Type Hints",
            description:
              "Learn how type hints improve readability and tooling in Python.",
            slug: "type-hints",
          },
          {
            title: "typing",
            description:
              "Learn Python's typing module for advanced type annotations.",
            slug: "typing-module",
          },
          {
            title: "mypy",
            description:
              "Learn how mypy performs static type checking for Python code.",
            slug: "mypy",
          },
          {
            title: "Python Architecture",
            description:
              "Learn how to structure Python applications using sound architectural principles.",
            slug: "python-architecture",
          },
        ],
      },

      {
        order: 11,
        title: "Specialized Domains",
        blurb:
          "Choose a Python specialization based on your interests and career goals.",
        concepts: [
          {
            title: "Web Development — Django / Flask / FastAPI Deep Dive",
            description:
              "Explore advanced web development using Python web frameworks.",
            slug: "specialized-web-development",
          },
          {
            title: "Data Science / ML — scikit-learn",
            description:
              "Learn the basics of machine learning with scikit-learn.",
            slug: "scikit-learn",
          },
          {
            title: "Data Science / ML — TensorFlow / PyTorch",
            description:
              "Explore the fundamentals of deep learning frameworks such as TensorFlow and PyTorch.",
            slug: "tensorflow-pytorch",
          },
          {
            title: "Automation — Selenium",
            description:
              "Learn browser automation using Selenium.",
            slug: "selenium",
          },
          {
            title: "Automation — BeautifulSoup",
            description:
              "Learn how BeautifulSoup can be used to parse and extract data from web pages.",
            slug: "beautifulsoup",
          },
          {
            title: "Automation — Web Scraping",
            description:
              "Learn the fundamentals of extracting structured information from websites.",
            slug: "web-scraping",
          },
          {
            title: "DevOps — Python Automation",
            description:
              "Learn how Python can automate DevOps and infrastructure tasks.",
            slug: "python-devops-automation",
          },
          {
            title: "DevOps — Ansible Modules",
            description:
              "Learn how Python relates to custom Ansible modules and automation.",
            slug: "ansible-modules",
          },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────
// Seed function
// ─────────────────────────────────────────────

async function seedSyllabus() {
  console.log("🌱 Starting Python syllabus seed...");

  for (const levelData of syllabus) {
    // Find existing level first
    let level = await db
      .select()
      .from(syllabusLevels)
      .where(eq(syllabusLevels.order, levelData.order))
      .limit(1);

    let levelId: string;

    if (level.length > 0) {
      levelId = level[0].id;

      console.log(`↪ Level already exists: ${levelData.title}`);
    } else {
      const [insertedLevel] = await db
        .insert(syllabusLevels)
        .values({
          order: levelData.order,
          title: levelData.title,
          description: levelData.description,
        })
        .returning();

      levelId = insertedLevel.id;

      console.log(`✓ Created level: ${levelData.title}`);
    }

    for (const topicData of levelData.topics) {
      // Find existing topic using level + order
      const existingTopic = await db
        .select()
        .from(syllabusTopics)
        .where(
          and(
            eq(syllabusTopics.levelId, levelId),
            eq(syllabusTopics.order, topicData.order),
          ),
        )
        .limit(1);

      let topicId: string;

      if (existingTopic.length > 0) {
        topicId = existingTopic[0].id;

        console.log(
          `  ↪ Topic already exists: ${topicData.title}`,
        );
      } else {
        const [insertedTopic] = await db
          .insert(syllabusTopics)
          .values({
            levelId,
            order: topicData.order,
            title: topicData.title,
            blurb: topicData.blurb,
          })
          .returning();

        topicId = insertedTopic.id;

        console.log(`  ✓ Created topic: ${topicData.title}`);
      }

      for (let i = 0; i < topicData.concepts.length; i++) {
        const concept = topicData.concepts[i];

        // conceptSlug is globally unique.
        const existingConcept = await db
          .select()
          .from(syllabusConcepts)
          .where(eq(syllabusConcepts.conceptSlug, concept.slug))
          .limit(1);

        if (existingConcept.length > 0) {
          console.log(
            `    ↪ Concept already exists: ${concept.title}`,
          );

          continue;
        }

        await db.insert(syllabusConcepts).values({
          topicId,
          order: i + 1,
          title: concept.title,
          description: concept.description,
          conceptSlug: concept.slug,
        });

        console.log(`    ✓ Created concept: ${concept.title}`);
      }
    }
  }

  console.log("✅ Python syllabus seed completed successfully.");
}

seedSyllabus()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed to seed Python syllabus:");
    console.error(error);
    process.exit(1);
  });