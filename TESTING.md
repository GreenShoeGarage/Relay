# RELAY v1.0 Test Notes

## Automated checks performed

- Embedded JavaScript syntax checked with `node --check`
- HTML parsed to verify unique element IDs
- Required interface controls and application sections checked by static test script
- Project package checked for external script, stylesheet, font, and image dependencies
- ZIP archive integrity checked after packaging

## Recommended browser acceptance checks

1. Open `relay.html` and confirm both demo requests appear.
2. Send **Get sample todo** and confirm a JSON response appears.
3. Change the active environment and confirm variables resolve in the request URL.
4. Add query parameters and headers, disable individual rows, and send again.
5. Select each authentication mode and verify the correct controls appear.
6. Create and format a JSON body.
7. Save, duplicate, move, and delete requests.
8. Send several requests and reopen them from History.
9. Generate code in all four supported languages.
10. Export a project and verify secret values are blank in the JSON.
11. Import the exported project.
12. Refresh the browser and confirm local state is restored.
13. Toggle dark and light modes.
14. Drag the horizontal divider between request and response panes.
15. Test `Ctrl/Cmd + Enter` and `Ctrl/Cmd + S`.

## Expected limitation

Calls to APIs that do not allow browser-origin requests will fail because of CORS. This is expected in v1.0 and is the primary target for the v1.1 gateway.
