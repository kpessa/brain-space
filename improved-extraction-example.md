# Improved Thought Extraction Examples

## Before (with fluff):
```
"I really need to basically prepare the presentation slides for tomorrow's meeting"
"We should probably think about booking the hotel and also the flight for the trip"
"I was thinking that maybe I should learn React Native or something like that"
"There's this project at work that I kind of need to finish up pretty soon"
```

## After (core ideas extracted):
```
"Prepare presentation slides for tomorrow's meeting"
"Book hotel" 
"Book flight for trip"
"Learn React Native"
"Finish project at work"
```

## Key Improvements:

### 1. Removes Filler Words:
- "I need to", "I should", "We have to" → removed
- "basically", "actually", "really" → removed
- "kind of", "sort of", "pretty much" → removed
- "maybe", "perhaps", "probably" → removed

### 2. Splits Compound Ideas:
- "booking the hotel and also the flight" → "Book hotel" + "Book flight"
- "prepare slides and review specs" → "Prepare slides" + "Review specs"

### 3. Extracts Core Actions:
- "I was thinking that maybe I should learn" → "Learn"
- "need to finish up pretty soon" → "Finish"

### 4. Removes Vague Endings:
- "or something like that" → removed
- "and stuff", "and things" → removed
- "etc", "and so on" → removed

## Real Example:

**Input:**
```
So I really need to prepare for the big client meeting tomorrow, and I should 
probably also review the technical specifications that we discussed last week. 
I'm thinking about maybe taking that React Native course or something to improve 
my mobile development skills. Oh and there's also the New York trip next month 
that I kind of need to book the hotel and flight for pretty soon.
```

**Output Nodes:**
- Work:
  - "Prepare for client meeting tomorrow"
  - "Review technical specifications"
- Learning:
  - "Take React Native course"
  - "Improve mobile development skills"
- Travel:
  - "Book hotel for New York trip"
  - "Book flight for New York trip"