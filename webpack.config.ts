module.exports = {
    // ... other webpack config options
  
    module: {
      rules: [
        {
          test: /\.tsx?$/, // match TypeScript files
          exclude: /node_modules/,
          use: 'ts-loader',
        },
        // ... other loaders for different file types
      ],
    },
    
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    
    // ... other webpack config options
}