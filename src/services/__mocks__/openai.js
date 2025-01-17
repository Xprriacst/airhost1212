const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Ceci est une réponse de test'
            }
          }
        ]
      })
    }
  }
};

const OpenAI = jest.fn().mockImplementation(() => mockOpenAI);
module.exports = OpenAI;
