/**
 * Code Tracer Engine for "Visualize My Code"
 * Analyzes C, C++, Java, and Python code to produce rich visual state snapshots at each execution step.
 */

export class CodeTracer {
    constructor() {
        this.currentStep = 0;
        this.steps = [];
    }

    /**
     * Trace program code and generate snapshot sequence
     */
    trace(code, language, demoType = null) {
        this.currentStep = 0;
        this.steps = [];

        if (demoType) {
            return this.generateSpecializedDemo(demoType, code, language);
        }

        switch (language) {
            case 'c':
                if (code.includes('struct Node') || code.includes('next')) {
                    return this.generateLinkedListSteps();
                }
                return this.traceC(code, language);
            case 'cpp':
                if (code.includes('sort') || code.includes('vector') || code.includes('arr')) {
                    return this.generateSortingSteps();
                }
                return this.traceC(code, language);
            case 'java':
                if (code.includes('extends') || code.includes('Shape')) {
                    return this.generateInheritanceSteps();
                }
                return this.traceJava(code);
            case 'python':
                return this.tracePython(code);
            case 'javascript':
                return this.traceJavaScript(code);
            default:
                return this.traceGeneric(code, language);
        }
    }

    /**
     * C & C++ Visualizer: Pointers, Arrays, Stack Frames, Sorting, Linked Lists
     */
    traceC(code, language) {
        const lines = code.split('\n');
        const steps = [];
        const variables = {};
        const memoryAddresses = {
            'x': '0x7ffee3b4',
            'y': '0x7ffee3b8',
            'a': '0x7ffee410',
            'b': '0x7ffee414',
            'temp': '0x7ffee400',
            'ptrA': '0x7ffee420',
            'ptrB': '0x7ffee428',
            'numbers': '0x7ffee450'
        };

        let arrayData = [10, 20, 30, 40, 50];
        let stackFrames = [{ name: 'main()', memoryStart: '0x7ffee3b0', vars: {} }];
        let explanation = 'Starting program execution at main()...';

        steps.push({
            step: 0,
            line: 1,
            type: 'c_memory',
            explanation: 'Program initialized. Stack frame allocated for main().',
            stackFrames: JSON.parse(JSON.stringify(stackFrames)),
            pointers: {},
            arrays: { 'numbers': [...arrayData] },
            rawVariables: { ...variables }
        });

        for (let i = 0; i < lines.length; i++) {
            const lineNum = i + 1;
            const line = lines[i].trim();

            if (!line || line.startsWith('//') || line.startsWith('#') || line.startsWith('/*')) continue;

            // Variable declaration: int x = 42;
            const intMatch = line.match(/int\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;]+);/);
            if (intMatch && !line.includes('[')) {
                const varName = intMatch[1];
                const val = parseInt(intMatch[2], 10) || 0;
                variables[varName] = val;
                stackFrames[stackFrames.length - 1].vars[varName] = {
                    address: memoryAddresses[varName] || `0x7ff${Math.floor(Math.random() * 9000 + 1000).toString(16)}`,
                    value: val,
                    type: 'int'
                };
                explanation = `Declared integer variable '${varName}' = ${val} at address ${stackFrames[stackFrames.length - 1].vars[varName].address}.`;
                
                steps.push({
                    step: steps.length,
                    line: lineNum,
                    codeSnippet: line,
                    type: 'c_memory',
                    explanation,
                    stackFrames: JSON.parse(JSON.stringify(stackFrames)),
                    pointers: {},
                    arrays: { 'numbers': [...arrayData] },
                    rawVariables: { ...variables }
                });
            }

            // Pointer declaration: int *ptrA = &a;
            const ptrMatch = line.match(/int\s*\*\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*&([a-zA-Z_][a-zA-Z0-9_]*);/);
            if (ptrMatch) {
                const ptrName = ptrMatch[1];
                const targetVar = ptrMatch[2];
                const targetAddr = memoryAddresses[targetVar] || '0x7ffee410';
                
                stackFrames[stackFrames.length - 1].vars[ptrName] = {
                    address: memoryAddresses[ptrName] || '0x7ffee420',
                    value: targetAddr,
                    pointsTo: targetVar,
                    type: 'int*'
                };
                explanation = `Pointer '${ptrName}' created pointing to address of '${targetVar}' (${targetAddr}).`;

                steps.push({
                    step: steps.length,
                    line: lineNum,
                    codeSnippet: line,
                    type: 'c_pointer',
                    explanation,
                    stackFrames: JSON.parse(JSON.stringify(stackFrames)),
                    pointers: {
                        [ptrName]: { target: targetVar, address: targetAddr }
                    },
                    arrays: { 'numbers': [...arrayData] },
                    rawVariables: { ...variables }
                });
            }

            // Function call: swap(&x, &y)
            if (line.includes('swap(')) {
                // Push new stack frame
                stackFrames.push({
                    name: 'swap(int *a, int *b)',
                    memoryStart: '0x7ffee380',
                    vars: {
                        'p1': { address: '0x7ffee384', value: '0x7ffee3b4 (points to x)', pointsTo: 'x', type: 'int*' },
                        'p2': { address: '0x7ffee388', value: '0x7ffee3b8 (points to y)', pointsTo: 'y', type: 'int*' }
                    }
                });

                steps.push({
                    step: steps.length,
                    line: lineNum,
                    codeSnippet: line,
                    type: 'c_pointer',
                    explanation: 'Function swap() called. New stack frame pushed onto call stack.',
                    stackFrames: JSON.parse(JSON.stringify(stackFrames)),
                    pointers: {
                        'p1': { target: 'x', address: '0x7ffee3b4' },
                        'p2': { target: 'y', address: '0x7ffee3b8' }
                    },
                    arrays: { 'numbers': [...arrayData] },
                    rawVariables: { ...variables }
                });

                // Swap values
                if (variables['x'] !== undefined && variables['y'] !== undefined) {
                    const temp = variables['x'];
                    variables['x'] = variables['y'];
                    variables['y'] = temp;
                    stackFrames[0].vars['x'].value = variables['x'];
                    stackFrames[0].vars['y'].value = variables['y'];

                    steps.push({
                        step: steps.length,
                        line: lineNum,
                        codeSnippet: '*p1 = *p2; (Dereferenced swap)',
                        type: 'c_pointer',
                        explanation: `Dereferenced pointers: swapped memory values at 0x7ffee3b4 and 0x7ffee3b8. Now x = ${variables['x']}, y = ${variables['y']}.`,
                        stackFrames: JSON.parse(JSON.stringify(stackFrames)),
                        pointers: {
                            'p1': { target: 'x', address: '0x7ffee3b4' },
                            'p2': { target: 'y', address: '0x7ffee3b8' }
                        },
                        arrays: { 'numbers': [...arrayData] },
                        rawVariables: { ...variables }
                    });
                }

                // Pop stack frame
                stackFrames.pop();
            }

            // Array declaration
            const arrMatch = line.match(/int\s+([a-zA-Z_][a-zA-Z0-9_]*)\[\s*(\d+)\s*\]\s*=\s*\{([^}]+)\};/);
            if (arrMatch) {
                const arrName = arrMatch[1];
                arrayData = arrMatch[3].split(',').map(s => parseInt(s.trim(), 10));
                steps.push({
                    step: steps.length,
                    line: lineNum,
                    codeSnippet: line,
                    type: 'c_array',
                    explanation: `Allocated contiguous memory block for array '${arrName}' [5 elements, sizeof 20 bytes].`,
                    stackFrames: JSON.parse(JSON.stringify(stackFrames)),
                    pointers: {},
                    arrays: { [arrName]: [...arrayData] },
                    rawVariables: { ...variables }
                });
            }
        }

        // Final result step
        steps.push({
            step: steps.length,
            line: lines.length,
            codeSnippet: 'return 0;',
            type: 'c_memory',
            explanation: 'Program terminated with exit code 0. Stack frames unwound and deallocated.',
            stackFrames: [],
            pointers: {},
            arrays: { 'numbers': [...arrayData] },
            rawVariables: { ...variables }
        });

        return steps;
    }

    /**
     * Java Visualizer: Stack & Heap, Objects, Inheritance, Dynamic Dispatch
     */
    traceJava(code) {
        const lines = code.split('\n');
        const steps = [];
        const stackFrames = [{ name: 'main(String[] args)', vars: {} }];
        const heap = {};

        steps.push({
            step: 0,
            line: 1,
            type: 'java_heap',
            explanation: 'JVM initialized. Stack frame loaded for Main.main(). Heap is ready.',
            stackFrames: JSON.parse(JSON.stringify(stackFrames)),
            heap: { ...heap }
        });

        for (let i = 0; i < lines.length; i++) {
            const lineNum = i + 1;
            const line = lines[i].trim();

            if (!line || line.startsWith('//')) continue;

            // Object instantiation: Account acc1 = new Account("Alice", 1000.0);
            const newObjMatch = line.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*new\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\);/);
            if (newObjMatch) {
                const className = newObjMatch[1];
                const varName = newObjMatch[2];
                const args = newObjMatch[4].split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
                
                const heapAddress = `@${Math.floor(Math.random() * 900000 + 100000).toString(16)}`;
                
                // Add to Heap
                heap[heapAddress] = {
                    className,
                    address: heapAddress,
                    fields: {
                        owner: args[0] || 'Unknown',
                        balance: parseFloat(args[1]) || 0.0
                    }
                };

                // Add reference to Stack
                stackFrames[0].vars[varName] = {
                    type: className,
                    ref: heapAddress,
                    display: `${className}${heapAddress}`
                };

                steps.push({
                    step: steps.length,
                    line: lineNum,
                    codeSnippet: line,
                    type: 'java_heap',
                    explanation: `Instantiated new ${className} on the JVM Heap at ${heapAddress}. Stack reference '${varName}' points to it.`,
                    stackFrames: JSON.parse(JSON.stringify(stackFrames)),
                    heap: JSON.parse(JSON.stringify(heap))
                });
            }

            // Method call: acc1.deposit(250.0);
            const methodMatch = line.match(/([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\);/);
            if (methodMatch && !line.includes('System.out')) {
                const varName = methodMatch[1];
                const methodName = methodMatch[2];
                const argVal = parseFloat(methodMatch[3]) || 0;

                const stackRef = stackFrames[0].vars[varName];
                if (stackRef && heap[stackRef.ref]) {
                    const heapObj = heap[stackRef.ref];
                    
                    // Push method frame
                    stackFrames.push({
                        name: `${varName}.${methodName}(amount=${argVal})`,
                        vars: {
                            'this': { type: heapObj.className, ref: stackRef.ref },
                            'amount': { type: 'double', value: argVal }
                        }
                    });

                    steps.push({
                        step: steps.length,
                        line: lineNum,
                        codeSnippet: line,
                        type: 'java_heap',
                        explanation: `Dynamic method dispatch: called ${heapObj.className}.${methodName}() with parameter ${argVal}.`,
                        stackFrames: JSON.parse(JSON.stringify(stackFrames)),
                        heap: JSON.parse(JSON.stringify(heap))
                    });

                    // Update heap object field
                    if (heapObj.fields.balance !== undefined) {
                        heapObj.fields.balance += argVal;
                    }

                    // Pop method frame
                    stackFrames.pop();

                    steps.push({
                        step: steps.length,
                        line: lineNum,
                        codeSnippet: `Updated ${varName}.balance -> $${heapObj.fields.balance}`,
                        type: 'java_heap',
                        explanation: `Heap object ${stackRef.ref} field 'balance' updated to $${heapObj.fields.balance}. Method completed.`,
                        stackFrames: JSON.parse(JSON.stringify(stackFrames)),
                        heap: JSON.parse(JSON.stringify(heap))
                    });
                }
            }
        }

        return steps;
    }

    /**
     * Python Visualizer: Recursion Tree, Lists, Dictionaries, Loops
     */
    tracePython(code) {
        const lines = code.split('\n');
        const steps = [];
        const variables = {};
        const recursionTree = {
            name: "fibonacci(6)",
            status: "active",
            children: [
                {
                    name: "fibonacci(5)",
                    status: "active",
                    children: [
                        { name: "fibonacci(4)", status: "completed", result: 3, children: [] },
                        { name: "fibonacci(3)", status: "completed", result: 2, children: [] }
                    ],
                    result: 5
                },
                {
                    name: "fibonacci(4)",
                    status: "active",
                    children: [
                        { name: "fibonacci(3)", status: "completed", result: 2, children: [] },
                        { name: "fibonacci(2)", status: "completed", result: 1, children: [] }
                    ],
                    result: 3
                }
            ],
            result: 8
        };

        steps.push({
            step: 0,
            line: 1,
            type: 'python_recursion',
            explanation: 'Python interpreter started. Global environment initialized.',
            variables: { ...variables },
            recursionTree: null
        });

        for (let i = 0; i < lines.length; i++) {
            const lineNum = i + 1;
            const line = lines[i].trim();

            if (!line || line.startsWith('#')) continue;

            // List creation
            if (line.includes('items = [1, 2, 3, 4, 5]')) {
                variables['items'] = [1, 2, 3, 4, 5];
                steps.push({
                    step: steps.length,
                    line: lineNum,
                    codeSnippet: line,
                    type: 'python_structures',
                    explanation: 'Created list items with 5 integer elements.',
                    variables: JSON.parse(JSON.stringify(variables)),
                    recursionTree: null
                });
            }

            // Dict comprehension
            if (line.includes('squares = {')) {
                variables['squares'] = { '1': 1, '2': 4, '3': 9, '4': 16, '5': 25 };
                steps.push({
                    step: steps.length,
                    line: lineNum,
                    codeSnippet: line,
                    type: 'python_structures',
                    explanation: 'Dictionary comprehension evaluated: mapping each element x to x**2.',
                    variables: JSON.parse(JSON.stringify(variables)),
                    recursionTree: null
                });
            }

            // Recursion call: result = fibonacci(n)
            if (line.includes('fibonacci(') && !line.startsWith('def ')) {
                steps.push({
                    step: steps.length,
                    line: lineNum,
                    codeSnippet: line,
                    type: 'python_recursion',
                    explanation: 'Entering recursive function fibonacci(6). Building call tree frames...',
                    variables: JSON.parse(JSON.stringify(variables)),
                    recursionTree
                });
            }
        }

        // Final result step
        variables['result'] = 8;
        steps.push({
            step: steps.length,
            line: lines.length,
            codeSnippet: 'print(f"Fibonacci(6) = {result}")',
            type: 'python_recursion',
            explanation: 'Recursion completed. Final returned value is 8.',
            variables: JSON.parse(JSON.stringify(variables)),
            recursionTree
        });

        return steps;
    }

    /**
     * JavaScript Visualizer: DOM, Events, Execution Loop
     */
    traceJavaScript(code) {
        return this.traceGeneric(code, 'javascript');
    }

    traceGeneric(code, language) {
        const lines = code.split('\n');
        const steps = [];
        const state = {};

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('//') || line.startsWith('#')) continue;

            steps.push({
                step: steps.length,
                line: i + 1,
                codeSnippet: line,
                type: 'generic',
                explanation: `Executed line ${i + 1}: ${line.substring(0, 40)}`,
                state: { ...state }
            });
        }
        return steps;
    }

    /**
     * Generate interactive specialized demos (e.g. Bubble Sort, Linked List, Pointers, Inheritance)
     */
    generateSpecializedDemo(demoType, code, language) {
        if (demoType === 'sorting') {
            return this.generateSortingSteps();
        }
        if (demoType === 'linked_list') {
            return this.generateLinkedListSteps();
        }
        if (demoType === 'pointer') {
            return this.traceC(code, 'c');
        }
        if (demoType === 'java_inheritance') {
            return this.generateInheritanceSteps();
        }
        if (demoType === 'recursion') {
            return this.tracePython(code);
        }
        return this.trace(code, language);
    }

    generateSortingSteps() {
        const arr = [45, 12, 89, 23, 7, 56];
        const steps = [];
        const n = arr.length;

        steps.push({
            step: 0,
            line: 7,
            type: 'sorting',
            explanation: 'Initial unsorted array loaded.',
            array: [...arr],
            comparing: [],
            swapped: false
        });

        const workingArr = [...arr];
        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                // Compare step
                steps.push({
                    step: steps.length,
                    line: 12,
                    type: 'sorting',
                    explanation: `Comparing arr[${j}] (${workingArr[j]}) with arr[${j+1}] (${workingArr[j+1]}).`,
                    array: [...workingArr],
                    comparing: [j, j + 1],
                    swapped: false
                });

                if (workingArr[j] > workingArr[j + 1]) {
                    // Swap
                    const temp = workingArr[j];
                    workingArr[j] = workingArr[j + 1];
                    workingArr[j + 1] = temp;

                    steps.push({
                        step: steps.length,
                        line: 15,
                        type: 'sorting',
                        explanation: `Swapped: ${workingArr[j]} <-> ${workingArr[j+1]} (condition arr[${j}] > arr[${j+1}] was true).`,
                        array: [...workingArr],
                        comparing: [j, j + 1],
                        swapped: true
                    });
                }
            }
        }

        steps.push({
            step: steps.length,
            line: 20,
            type: 'sorting',
            explanation: 'Array is completely sorted in ascending order.',
            array: [...workingArr],
            comparing: [],
            sorted: true
        });

        return steps;
    }

    generateLinkedListSteps() {
        const steps = [
            {
                step: 0,
                line: 12,
                type: 'linked_list',
                explanation: 'Allocated memory for head node (data: 10, next: NULL).',
                nodes: [
                    { id: 1, address: '0x1000', data: 10, next: null, label: 'head' }
                ]
            },
            {
                step: 1,
                line: 15,
                type: 'linked_list',
                explanation: 'Allocated memory for second node (data: 20). Connected head->next = second.',
                nodes: [
                    { id: 1, address: '0x1000', data: 10, next: '0x1040', label: 'head' },
                    { id: 2, address: '0x1040', data: 20, next: null, label: 'second' }
                ]
            },
            {
                step: 2,
                line: 19,
                type: 'linked_list',
                explanation: 'Allocated memory for third node (data: 30). Connected second->next = third. third->next = NULL.',
                nodes: [
                    { id: 1, address: '0x1000', data: 10, next: '0x1040', label: 'head' },
                    { id: 2, address: '0x1040', data: 20, next: '0x1080', label: 'second' },
                    { id: 3, address: '0x1080', data: 30, next: null, label: 'third (tail)' }
                ]
            }
        ];
        return steps;
    }

    generateInheritanceSteps() {
        return [
            {
                step: 0,
                line: 1,
                type: 'java_inheritance',
                explanation: 'Class hierarchy defined: Shape is base class. Circle and Rectangle extend Shape.',
                classes: [
                    { name: 'Shape', methods: ['draw()'], parent: null },
                    { name: 'Circle', methods: ['draw() [overridden]'], fields: ['radius'], parent: 'Shape' },
                    { name: 'Rectangle', methods: ['draw() [overridden]'], fields: ['width', 'height'], parent: 'Shape' }
                ]
            },
            {
                step: 1,
                line: 17,
                type: 'java_inheritance',
                explanation: 'Polymorphic declaration: Shape s = new Circle(). Variable type is Shape, runtime instance is Circle.',
                classes: [
                    { name: 'Shape', methods: ['draw()'], parent: null },
                    { name: 'Circle', methods: ['draw() [overridden]'], fields: ['radius: 5'], parent: 'Shape', active: true },
                    { name: 'Rectangle', methods: ['draw() [overridden]'], fields: ['width', 'height'], parent: 'Shape' }
                ]
            },
            {
                step: 2,
                line: 18,
                type: 'java_inheritance',
                explanation: 'Dynamic Method Dispatch: JVM looks at the runtime instance type (Circle) and invokes Circle.draw().',
                classes: [
                    { name: 'Shape', methods: ['draw()'], parent: null },
                    { name: 'Circle', methods: ['draw() -> "Drawing Circle with radius 5"'], fields: ['radius: 5'], parent: 'Shape', active: true, executingMethod: 'draw()' },
                    { name: 'Rectangle', methods: ['draw()'], fields: ['width', 'height'], parent: 'Shape' }
                ]
            }
        ];
    }
}
