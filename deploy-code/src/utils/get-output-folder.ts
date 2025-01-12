export const getOutputFolder = (framework: string) => {
    // Determine the output folder based on the framework
    let outputFolder: string = '';
    switch (framework) {
        case 'react':
            outputFolder = 'public';
            break;
        case 'angular':
            outputFolder = 'dist';
            break;
        case 'vue':
            outputFolder = 'dist';
            break;
        default:
            break;
    }

    return outputFolder;
}