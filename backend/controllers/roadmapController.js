// controllers/roadmapController.js
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { executeWithKeyRotation, getGeminiKeys } = require("../utils/geminiHelper");

/**
 * Generates 18 action-oriented learning topics for a course topic using Gemini 1.5 Flash via LangChain.
 * POST /api/roadmap/generate
 */
async function generateRoadmapTopics(req, res) {
  const { courseName } = req.body;

  if (!courseName || typeof courseName !== "string" || !courseName.trim()) {
    return res.status(400).json({ success: false, message: "courseName is required." });
  }

  const keys = getGeminiKeys();
  if (keys.length === 0) {
    console.warn("⚠️ No Gemini API keys are configured on backend. Falling back to local offline generation.");
    return res.status(503).json({ success: false, message: "Gemini API key is not configured on backend." });
  }

  try {
    const prompt = `Create exactly 18 specific, actionable learning topics for a course called "${courseName}".
The topics should range from basic to advanced and be relevant to real-world applications.

Return ONLY a valid JSON array of strings, without any surrounding markdown backticks or formatting.
Example output format:
["Topic 1", "Topic 2", "Topic 3", ...]`;

    console.log(`🤖 [GEMINI] Generating topics for: "${courseName}"...`);
    
    const topics = await executeWithKeyRotation(async (apiKey) => {
      const model = new ChatGoogleGenerativeAI({
        apiKey,
        model: "gemini-2.5-flash",
        temperature: 0.7,
        maxRetries: 0,
      });
      const response = await model.invoke(prompt);
      
      let content = response.content.trim();
      // Strip markdown formatting if the model returned it anyway
      content = content.replace(/```json\n?|```\n?/g, '').trim();

      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Invalid output format: Expected a non-empty array of strings.");
      }
      return parsed;
    });

    console.log(`✅ [GEMINI] Successfully generated ${topics.length} topics for: "${courseName}"`);
    return res.json({ success: true, topics });

  } catch (err) {
    console.error("❌ [GEMINI] Error generating roadmap topics:", err);
    return res.status(500).json({
      success: false,
      message: "AI Roadmap generation failed. Falling back to local offline generator."
    });
  }
}


/**
 * Generates an offline cheat sheet summary notes in markdown based on the topic.
 */
function getOfflineCheatSheet(topicTitle, courseName) {
  const title = topicTitle.toLowerCase();
  const course = (courseName || '').toLowerCase();
  const isJavaContext = course.includes("java") || title.includes("java") || course.includes("spring") || title.includes("spring");

  // 1. Specific Microservices Match
  if (title.includes("microservice") || course.includes("microservice")) {
    return `# Study Notes: Microservices Architecture

## Key Concepts
- **Monolith vs Microservices**: A monolithic application is built as a single, unified unit. A microservices architecture decomposes the application into a collection of small, loosely coupled, and independently deployable services.
- **Decomposition Strategies**: Services are decomposed by business capability or subdomain (Domain-Driven Design).
- **Service Communication**: Microservices communicate either synchronously (REST APIs, gRPC) or asynchronously (Message Brokers like RabbitMQ, Apache Kafka).
- **API Gateway**: Acts as a single entry point for all clients, routing requests to the appropriate microservice and handling cross-cutting concerns like authentication and rate limiting.

## Illustrative Architecture Diagram (Conceptual)
\`\`\`
[ Client / Browser ]
         │ (HTTP)
         ▼
  [ API Gateway ]
   ├─── routing ───► [ User Service ] ───► (User DB)
   ├─── routing ───► [ Product Service ] ───► (Product DB)
   └─── routing ───► [ Order Service ] ───► (Order DB)
\`\`\`

## Common Gotchas & Mistakes to Avoid
- **Distributed Transactions**: Avoid attempting complex transactions across multiple databases. Use the Saga Pattern (choreography or orchestration) or Eventual Consistency instead.
- **Microservice Premium**: Do not build microservices too early. Monoliths are simpler to develop, test, and deploy for early-stage applications.
- **Shared Databases**: Never allow microservices to share the same database instance or tables. Each service must own its data to maintain loose coupling.

---
*Note: This is an offline fallback study sheet generated automatically because the AI rate limit was reached.*`;
  }

  // 2. Setup / Install / Environment Match
  if (title.includes("setup") || title.includes("environment") || title.includes("install")) {
    if (isJavaContext) {
      return `# Study Notes: Setting Up Your Java Development Environment

## Key Concepts
- **JDK vs JRE**: JDK (Java Development Kit) is for development and contains JRE (Java Runtime Environment) + development tools (compiler javac, debugger, etc.). JRE is only for running Java applications.
- **Environment Variables**: Setting \`JAVA_HOME\` points to the JDK installation directory, and adding \`bin\` to the system \`PATH\` allows running java/javac commands from any terminal.
- **IDE Choice**: Modern Java development uses IntelliJ IDEA, Eclipse, or VS Code with Java Extension Pack.

## Setup Steps & Verification
\`\`\`bash
# 1. Download JDK (e.g., LTS versions like JDK 17 or 21)
# 2. Configure environment variable (Windows path example):
setx JAVA_HOME "C:\\Program Files\\Java\\jdk-21"
setx PATH "%PATH%;%JAVA_HOME%\\bin"

# 3. Verify installation:
java -version
javac -version
\`\`\`

## Common Gotchas & Mistakes to Avoid
- **PATH Order**: If multiple Java versions are installed, ensure the desired one is listed first in the \`PATH\`.
- **Admin Privileges**: Setting environment variables via cmd/powershell might require administrator privileges to apply globally.
- **Restart Terminals**: Environment variable changes do not take effect in already open terminals.

---
*Note: This is an offline fallback study sheet generated automatically because the AI rate limit was reached.*`;
    } else {
      return `# Study Notes: Getting Started & Setup

## Key Concepts
- **Environment Setup**: Preparing your local machine with the correct dependencies, compilers, runtimes, or libraries.
- **Configuration Management**: Managing configuration parameters (like database credentials, port numbers, or API keys) securely using environment variables (\`.env\` files).
- **IDE & Tooling**: Using standard editors (VS Code, Cursor, IntelliJ) along with necessary plugins to speed up development.

## Setup Steps & Verification
\`\`\`bash
# 1. Clone the project repository
# 2. Install dependencies (e.g. Node: npm install, Python: pip install)
# 3. Configure environment variables
cp .env.example .env
# 4. Start the application
npm run dev
\`\`\`

## Common Gotchas & Mistakes to Avoid
- **Hardcoded Secrets**: Never commit private keys, passwords, or API keys to Git. Always use env files.
- **Missing Prerequisites**: Verify software dependencies (like Node version or database servers) match the project requirements.
- **Port Conflicts**: Ensure target ports (like 3000, 5000, or 8080) are not already in use by other running processes.

---
*Note: This is an offline fallback study sheet generated automatically because the AI rate limit was reached.*`;
    }
  }

  // 3. Syntax / Control Flow Match
  if (title.includes("syntax") || title.includes("control flow") || title.includes("loop") || title.includes("variable")) {
    if (isJavaContext) {
      return `# Study Notes: Core Java Syntax and Control Flow

## Key Concepts
- **Variables & Data Types**: Java is strongly typed. Primitive types include \`int\`, \`double\`, \`boolean\`, \`char\`. Reference types include \`String\`, \`Arrays\`, and \`Objects\`.
- **Control Flow**: Directs the flow of execution using conditional statements (\`if-else\`, \`switch\`) and loops (\`for\`, \`while\`, \`do-while\`).
- **Operators**: Includes arithmetic (\`+\`, \`-\`), logical (\`&&\`, \`||\`, \`!\`), and comparison (\`==\`, \`!=\`, \`<\`, \`>\`) operators.

## Example Code Snippet
\`\`\`java
public class CoreSyntaxDemo {
    public static void main(String[] args) {
        int age = 20;
        
        // Conditional Control Flow
        if (age >= 18) {
            System.out.println("Eligible to vote.");
        } else {
            System.out.println("Not eligible to vote.");
        }
        
        // Loop Control Flow
        System.out.print("Counting: ");
        for (int i = 1; i <= 5; i++) {
            System.out.print(i + " ");
        }
    }
}
\`\`\`

## Common Gotchas & Mistakes to Avoid
- **String Comparison**: Always use \`str1.equals(str2)\` instead of \`str1 == str2\` to compare string values. The \`==\` operator checks reference equality, not content.
- **Infinite Loops**: Ensure loop conditions have a clear path to becoming false to prevent hangs.
- **Switch Break Statement**: Forgetting the \`break\` statement in switch-case blocks causes fall-through, executing subsequent cases unexpectedly.

---
*Note: This is an offline fallback study sheet generated automatically because the AI rate limit was reached.*`;
    }
  }

  // 4. OOP Match
  if (title.includes("oop") || title.includes("object-oriented") || title.includes("class") || title.includes("inheritance") || title.includes("polymorphism")) {
    if (isJavaContext) {
      return `# Study Notes: Object-Oriented Programming (OOP) in Java

## Key Concepts
- **Classes and Objects**: A class is a blueprint, and an object is an instance of that blueprint containing state (fields) and behavior (methods).
- **Inheritance**: Allows a class (subclass) to inherit fields and methods from another class (superclass) using the \`extends\` keyword.
- **Polymorphism**: The ability of an object to take on many forms. Reflected in Method Overriding (runtime) and Method Overloading (compile-time).
- **Encapsulation & Abstraction**: Encapsulation hides internal state using \`private\` variables and exposes them via public getters/setters. Abstraction hides implementation details using \`abstract\` classes or \`interfaces\`.

## Example Code Snippet
\`\`\`java
// Abstraction & Interface
interface Animal {
    void makeSound();
}

// Inheritance & Polymorphism
class Dog implements Animal {
    private String name; // Encapsulation
    
    public Dog(String name) { this.name = name; }
    
    @Override
    public void makeSound() {
        System.out.println(name + " says: Woof!");
    }
}
\`\`\`

## Common Gotchas & Mistakes to Avoid
- **NPE (NullPointerException)**: Attempting to call methods on an object reference that is \`null\`. Always initialize objects before use.
- **Overriding Signature**: Ensure the \`@Override\` annotation is used. If the method signature doesn't match the superclass exactly, it becomes an overload instead of an override.
- **Access Modifier Misuse**: Making fields \`public\` violates encapsulation. Always default to \`private\` or \`protected\`.

---
*Note: This is an offline fallback study sheet generated automatically because the AI rate limit was reached.*`;
    }
  }

  // 5. Thread / Concurrency Match
  if (title.includes("thread") || title.includes("concurrency") || title.includes("multithreading") || title.includes("parallel")) {
    if (isJavaContext) {
      return `# Study Notes: Multithreading and Concurrency in Java

## Key Concepts
- **Thread vs Process**: A process is an executing program with its own memory space. A thread is the smallest unit of execution within a process; threads share process memory.
- **Creation Methods**: Threads can be created by subclassing the \`Thread\` class or implementing the \`Runnable\` interface (recommended).
- **Synchronization**: Prevents thread interference and memory consistency errors. The \`synchronized\` keyword ensures only one thread can access a resource at a time.
- **ExecutorService**: Part of \`java.util.concurrent\`, it manages a pool of threads, avoiding the overhead of manually creating threads for every task.

## Example Code Snippet
\`\`\`java
public class ThreadDemo {
    public static void main(String[] args) {
        // Implementing Runnable via Lambda
        Runnable task = () -> {
            System.out.println("Running in thread: " + Thread.currentThread().getName());
        };
        
        Thread thread = new Thread(task);
        thread.start(); // Starts execution asynchronously
    }
}
\`\`\`

## Common Gotchas & Mistakes to Avoid
- **Calling run() instead of start()**: Direct call to \`run()\` executes the code synchronously in the caller thread. Use \`start()\` to launch a new thread.
- **Deadlocks**: Occur when two or more threads are blocked forever, waiting for each other to release locks. Avoid circular lock acquisition.
- **Race Conditions**: Occur when multiple threads access shared mutable data without proper synchronization. Use atomic variables or locks.

---
*Note: This is an offline fallback study sheet generated automatically because the AI rate limit was reached.*`;
    }
  }

  // 6. Spring Boot / REST API Match
  if (title.includes("spring") || title.includes("boot") || title.includes("rest") || title.includes("api")) {
    if (isJavaContext) {
      return `# Study Notes: Spring Boot & REST APIs

## Key Concepts
- **Inversion of Control (IoC) & DI**: Spring container manages the lifecycle of application objects (Beans) and injects dependencies automatically using \`@Autowired\`.
- **Spring Boot**: An extension of Spring framework that simplifies configuration through starter dependencies and auto-configuration.
- **REST Controller**: Annotation \`@RestController\` combines \`@Controller\` and \`@ResponseBody\`, rendering JSON/XML directly to HTTP responses.
- **HTTP Methods**: Mapping requests using annotations like \`@GetMapping\`, \`@PostMapping\`, \`@PutMapping\`, and \`@DeleteMapping\`.

## Example Controller Code
\`\`\`java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = new User(id, "John Doe");
        return ResponseEntity.ok(user); // Returns 200 OK with JSON body
    }
}
\`\`\`

## Common Gotchas & Mistakes to Avoid
- **Component Scanning**: Spring Boot scans components in the same package (and subpackages) as the main application class annotated with \`@SpringBootApplication\`. Beans placed outside this package structure will not be scanned or injected.
- **Incorrect Exception Handling**: Avoid returning raw stack traces on errors. Use \`@ControllerAdvice\` or \`@ExceptionHandler\` for clean JSON error responses.
- **Database Connection Pool Exhaustion**: Ensure connections are closed or managed properly, especially when using JPA/Hibernate under high concurrent loads.

---
*Note: This is an offline fallback study sheet generated automatically because the AI rate limit was reached.*`;
    }
  }

  // Generic Fallback
  return `# Study Notes: ${topicTitle}

## Key Concepts
- **Core Principles**: Understanding the core elements and background of ${topicTitle} inside the context of ${courseName || 'this course'}.
- **Integration**: Examining how this topic relates to broader software engineering practices and patterns.
- **Practical Application**: Incorporating these patterns to solve real-world problems and build robust applications.

## Illustrative Demonstration
\`\`\`javascript
// Practical concept demonstration for: ${topicTitle}
function demonstrateConcept() {
  console.log("Analyzing concept: ${topicTitle}...");
  // Implement step-by-step logic
  return {
    topic: "${topicTitle}",
    status: "Active",
    verified: true
  };
}
console.log(demonstrateConcept());
\`\`\`

## Common Gotchas & Mistakes to Avoid
- **Lack of Prerequisites**: Ensure all required background concepts and settings are fully understood before implementation.
- **Incomplete Handling**: Account for exceptions, edge cases, and typical failure modes associated with ${topicTitle}.
- **Overcomplicating the Solution**: Start with the simplest working implementation before applying advanced patterns.

---
*Note: This is an offline fallback study sheet generated automatically because the AI rate limit was reached.*`;
}

/**
 * Generates a cheat sheet summary notes in markdown for a specific topic using Gemini.
 * POST /api/roadmap/cheat-sheet
 */
async function generateCheatSheet(req, res) {
  const { courseName, topicTitle } = req.body;

  if (!topicTitle || typeof topicTitle !== "string" || !topicTitle.trim()) {
    return res.status(400).json({ success: false, message: "topicTitle is required." });
  }

  const keys = getGeminiKeys();
  if (keys.length === 0) {
    console.warn("⚠️ [GEMINI] API keys are missing. Using offline cheat sheet fallback.");
    const cheatSheet = getOfflineCheatSheet(topicTitle, courseName);
    return res.json({ success: true, cheatSheet, isFallback: true });
  }

  try {
    const prompt = `You are a professional educational content creator.
Create a comprehensive, structured study notes cheat sheet for the topic: "${topicTitle}" in the context of the course: "${courseName || 'General'}".

Requirements:
- Explain key concepts clearly and concisely.
- Include 3-4 key bullet points, an illustrative example (or brief code snippet if relevant), and common gotchas/mistakes to avoid.
- Format the response using clean GitHub-style Markdown (use bold text, bullet points, headers, or code blocks).
- Do not include any HTML tags.
- Keep the overall length between 250-400 words.`;

    console.log(`🤖 [GEMINI] Generating cheat sheet for: "${topicTitle}"...`);
    
    const cheatSheet = await executeWithKeyRotation(async (apiKey) => {
      const model = new ChatGoogleGenerativeAI({
        apiKey,
        model: "gemini-2.5-flash",
        temperature: 0.7,
        maxRetries: 0,
      });
      const response = await model.invoke(prompt);
      return response.content;
    });

    console.log(`✅ [GEMINI] Successfully generated cheat sheet for: "${topicTitle}"`);
    return res.json({ success: true, cheatSheet });

  } catch (err) {
    console.error("❌ [GEMINI] Error generating cheat sheet, falling back to local generator:", err);
    const cheatSheet = getOfflineCheatSheet(topicTitle, courseName);
    return res.json({ success: true, cheatSheet, isFallback: true });
  }
}

module.exports = { generateRoadmapTopics, generateCheatSheet };
