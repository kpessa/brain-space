# Test Example for Hierarchical AI Categorization

## Example Input:
```
I have a project meeting tomorrow at 9am with the client to discuss the new features
Need to prepare the presentation slides and review the technical specs
My trip to New York is coming up next month, need to book hotel and flight
Also planning a vacation to Europe this summer, looking at flights to Paris
Weekend project: build a new garden bed in the backyard
Learn React Native for mobile development
Take online course on data structures
```

## Expected Output Structure:

**Root Node: "Brain Dump"**
├── **Work** (Parent Category)
│   ├── Project meeting tomorrow at 9am with client
│   ├── Prepare presentation slides
│   └── Review technical specs
├── **Trips & Travel** (Parent Category) 
│   ├── Book hotel and flight for New York trip
│   └── Plan Europe vacation - look at Paris flights
├── **Projects & Goals** (Parent Category)
│   └── Build garden bed in backyard
└── **Learning & Growth** (Parent Category)
    ├── Learn React Native for mobile development
    └── Take online course on data structures

## Key Improvements:

1. **Hierarchical Structure**: Creates parent category nodes with child thought nodes
2. **Content-Based Categories**: Identifies "Work", "Trips & Travel", etc. based on actual content themes
3. **Concise Nodes**: Breaks down verbose thoughts into focused, actionable items
4. **Intelligent Grouping**: Groups related thoughts under thematic categories
5. **Priority Ordering**: Most important categories (by number of items) appear first

## Technical Implementation:

- **AI analyzes content** to identify 3-5 main themes from the actual text
- **Breaks down long thoughts** into concise, focused nodes  
- **Creates parent-child hierarchy** with category parents and thought children
- **Sorts by importance** with most populated categories first
- **Proper visual layout** with categories on left, thoughts on right