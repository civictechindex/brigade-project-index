const decoratorClasses = {
    GitHubRepository: require('./GitHubRepository.js'),
    Git: require('./Git.js'),
    // PublicCode: require('./PublicCode.js'),
};

/**
 * Loop through each available decorator class and apply all qualifying decorators
 */
module.exports = async function decorateProjectData(projectData) {
    for (const decoratorClassName in decoratorClasses) {
        const decoratorClass = decoratorClasses[decoratorClassName];
        if (await decoratorClass.canDecorate(projectData)) {
            await decoratorClass.decorate(projectData);
        }
    }
};
