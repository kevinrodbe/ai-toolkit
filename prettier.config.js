import sharedPrettier from '@rodbe/prettier-config';

/**
 * @type {import("prettier").Config}
 */
const config = {
  ...sharedPrettier,
  overrides: [
    {
      files: '*.md',
      options: {
        parser: 'markdown',
        proseWrap: 'always',
      },
    },
  ],
};

export default config;
