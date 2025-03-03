export const getOutputFolder = (framework: string) => {
    // Determine the output folder based on the framework
    let outputFolder: string = '';
    switch (framework) {
        case 'react':
            outputFolder = 'dist';
            break;
        case 'angular':
            outputFolder = 'dist';
            break;
        case 'vue':
            outputFolder = 'dist';
            break;
        case 'nextjs':
            outputFolder = '.next';
        default:
            break;
    }

    return outputFolder;
}