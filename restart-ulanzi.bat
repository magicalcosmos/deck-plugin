@echo off
echo "UlanziDeck Restart"
taskkill /im UlanziDeck.exe
echo "UlanziDeck Stop"
start /d "C:\Program Files (x86)\UlanziDeck\" UlanziDeck.exe
echo "UlanziDeck Start"
exit