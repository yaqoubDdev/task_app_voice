import OpenAI from "openai"
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

// const response = await client.responses.create({
//     model: "gpt-4o",
//     instructions: 'you talk like yoda',
//     input: "what to do today?",
    
// })

// const completion = await client.chat.completions.create({
//   model: 'gpt-4o',
//   messages: [
//     { role: 'developer', content: 'Talk like yoda.' },
//     { role: 'user', content: 'Are semicolons optional in JavaScript?' },
//   ],
// });

// console.log(completion.choices[0].message.content)

// const stream = await client.responses.create({
//   model: 'gpt-4o',
//   input: 'Say "Sheep sleep deep" ten times fast!',
//   stream: true,
// });

// for await (const event of stream) {
//   console.log(event);
// }
