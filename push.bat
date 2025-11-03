@echo off
echo Adding all changes to Git...
git add .

echo.
echo Committing changes...
git commit -m "Update website"

echo.
echo Pushing to GitHub...
git push

echo.
echo Success! Changes have been pushed to khanfarris.com
pause

