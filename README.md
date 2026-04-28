# Fantasy Football App

## Description

This repository contains the code for a fantasy football app. There is a user login/sign up screen to start. Selecting remember me extends the session to 30 idle days before expiring the session, while not having it selected has a 1 hour idle timeout that is refreshed every 15 minutes. As a user, you can view and join already existing leagues or create your own. Creating a league has the options of a league name, max teams to allow (2-16), max roster size (1-30), and a scoring type. The 3 scoring types are standard, PPR, and Half PPR. Within the league, you can view the free agency table, which allows users to add players to their team that are not on another team yet. Free agency has postion filters, sorting prompts, and a name search to find players better. Also within the league screen is the ability to join the league by creating a team. Team creation prompts you to enter a team name and then it brings you to the lineup screen, where you can also edit your team name from. You can fill out your roster by adding free agents. Each player has points based on the league's scoring type. On your lineup screen, you can assign starters or bench players. The starting lineup is restricted to 1 QB, 2 HB, 2 WR, 1 TE, 1 RB/WR/TE, 1 DEF, and 1 K. The team view screen in the league shows the combined points for your starting lineup. In the roster view or free agency page, you can also click on a players name which will bring you to that players stat page. This page shows all the stats that a player has to better view performance and a points per week calculation, with a season total presented at the bottom.

## Set Up

You can access the live app through this link. The database isn't guranteed to be running at the time, which could lead to signin not working.

https://my-fantasy-league.vercel.app/


## Setting Up Schema



## Default Test Users
### Test Users
Username: Test1
Password: TrustInMe

Username: Test2
Password: AnotherPassToForg3t
