# load library ggplot
library(ggplot2)
library(plyr)
# load sample data file
setwd(dirname(parent.frame(2)$ofile))
data <- read.csv("10yearAUSOpenMatches.csv")
#data$country1 <- as.character(unlist(data$country1))
#data$country2 <- as.character(unlist(data$country2))
data$firstServe1 <- gsub('%', '', data$firstServe1)
data$firstServe1 <- as.numeric(data$firstServe1)/100
data$firstServe2 <- gsub('%', '', data$firstServe2)
data$firstServe2 <- as.numeric(data$firstServe2)/100
data$firstPointWon1 <- gsub('%', '', data$firstPointWon1)
data$firstPointWon1 <- as.numeric(data$firstPointWon1)/100
data$firstPointWon2 <- gsub('%', '', data$firstPointWon2)
data$firstPointWon2 <- as.numeric(data$firstPointWon2)/100
data$secPointWon1 <- gsub('%', '', data$secPointWon1)
data$secPointWon1 <- as.numeric(data$secPointWon1)/100
data$secPointWon2 <- gsub('%', '', data$secPointWon2)
data$secPointWon2 <- as.numeric(data$secPointWon2)/100
data$avgSecServe1 <- gsub('%', '', data$avgSecServe1)
data$avgSecServe1 <- as.numeric(data$avgSecServe1)
data$avgSecServe1[data$avgSecServe1 == 0] <- NA
data$avgSecServe2 <- gsub('%', '', data$avgSecServe2)
data$avgSecServe2 <- as.numeric(data$avgSecServe2)
data$avgSecServe2[data$avgSecServe2 == 0] <- NA
data$break1 <- gsub('%', '', data$break1)
data$break1 <- as.numeric(data$break1)/100
data$break2 <- gsub('%', '', data$break2)
data$break2 <- as.numeric(data$break2)/100
data$return1 <- gsub('%', '', data$return1)
data$return1 <- as.numeric(data$return1)/100
data$return2 <- gsub('%', '', data$return2)
data$return2 <- as.numeric(data$return2)/100
data$net1 <- gsub('%', '', data$net1)
data$net1 <- as.numeric(data$net1)/100
data$net2 <- gsub('%', '', data$net2)
data$net2 <- as.numeric(data$net2)/100


player_names <- sort(union(levels(data[1,'player1']), levels(data[1,'player2'])))
winning_stat <- count(data, vars = c('winner', 'round'))
winning_count <- count(data, vars = 'winner')
champ_count <- winning_stat[winning_stat$round == 'Final',]

#write(json_data, 'data.json')
players = list()
countries = list()
pairs = list()
matches = list()

i <- 1
for (name in player_names) {
  temp <- data[data$player2 == name,]
  if (nrow(temp) != 0) {
    country <- unique(temp$country2)
  }
  else {
    country <- unique(temp$country1)
  }
  
  temp <- winning_count[winning_count$winner == name,]
  win = 0
  if (nrow(temp) != 0) {
    win = temp$freq
  }
  temp <- champ_count[champ_count$winner == name,]
  champ = 0
  if (nrow(temp) != 0) {
    champ = temp$freq
  }
  x <- list(name = name, win = win, champ = champ, country = country)
  players[[i]] <- x
  i <- i + 1
}

match_count = 1
temp <- data
temp$visited = 0
while (nrow(temp) != 0) {
  player1 <- which(player_names == temp[1,]$player1)
  player2 <- which(player_names == temp[1,]$player2)
  if (player1 > player2) {
    temp_name <- player1
    player1 <- player2
    player2 <- temp_name
  }
  index1 <- which(temp$player1 == player_names[player1] & temp$player2 == player_names[player2]) 
  index2 <- which(temp$player2 == player_names[player1] & temp$player1 == player_names[player2])
  index <- c(index1, index2)
  firstServe1 <- temp[index1,]$firstServe1
  firstServe1 <- c(firstServe1, temp[index2,]$firstServe2)
  firstServe2 <- temp[index1,]$firstServe2
  firstServe2 <- c(firstServe2, temp[index2,]$firstServe1)
  ace1 <- temp[index1,]$ace1
  ace1 <- c(ace1, temp[index2,]$ace2)
  ace2 <- temp[index1,]$ace2
  ace2 <- c(ace2, temp[index2,]$ace1)
  double1 <- temp[index1,]$double1
  double1 <- c(double1, temp[index2,]$double2)
  double2 <- temp[index1,]$double2
  double2 <- c(double2, temp[index2,]$double1)
  firstPointWon1 <- temp[index1,]$firstPointWon1
  firstPointWon1 <- c(firstPointWon1, temp[index2,]$firstPointWon2)
  firstPointWon2 <- temp[index1,]$firstPointWon2
  firstPointWon2 <- c(firstPointWon2, temp[index2,]$firstPointWon1)
  secPointWon1 <- temp[index1,]$secPointWon1
  secPointWon1 <- c(secPointWon1, temp[index2,]$secPointWon2)
  secPointWon2 <- temp[index1,]$secPointWon2
  secPointWon2 <- c(secPointWon2, temp[index2,]$secPointWon1)
  fastServe1 <- temp[index1,]$fastServe1
  fastServe1 <- c(fastServe1, temp[index2,]$fastServe2)
  fastServe2 <- temp[index1,]$fastServe2
  fastServe2 <- c(fastServe2, temp[index2,]$fastServe1)
  avgFirstServe1 <- temp[index1,]$avgFirstServe1
  avgFirstServe1 <- c(avgFirstServe1, temp[index2,]$avgFirstServe2)
  avgFirstServe2 <- temp[index1,]$avgFirstServe2
  avgFirstServe2 <- c(avgFirstServe2, temp[index2,]$avgFirstServe1)
  avgSecServe1 <- temp[index1,]$avgSecServe1
  avgSecServe1 <- c(avgSecServe1, temp[index2,]$avgSecServe2)
  avgSecServe2 <- temp[index1,]$avgSecServe2
  avgSecServe2 <- c(avgSecServe2, temp[index2,]$avgSecServe1)
  break1 <- temp[index1,]$break1
  break1 <- c(break1, temp[index2,]$break2)
  break2 <- temp[index1,]$break2
  break2 <- c(break2, temp[index2,]$break1)
  return1 <- temp[index1,]$return1
  return1 <- c(return1, temp[index2,]$return2)
  return2 <- temp[index1,]$return2
  return2 <- c(return2, temp[index2,]$return1)
  total1 <- temp[index1,]$total1
  total1 <- c(total1, temp[index2,]$total2)
  total2 <- temp[index1,]$total2
  total2 <- c(total2, temp[index2,]$total1)
  winner1 <- temp[index1,]$winner1
  winner1 <- c(winner1, temp[index2,]$winner2)
  winner2 <- temp[index1,]$winner2
  winner2 <- c(winner2, temp[index2,]$winner1)
  error1 <- temp[index1,]$error1
  error1 <- c(error1, temp[index2,]$error2)
  error2 <- temp[index1,]$error2
  error2 <- c(error2, temp[index2,]$error1)
  net1 <- temp[index1,]$net1
  net1 <- c(net1, temp[index2,]$net2)
  net2 <- temp[index1,]$net2
  net2 <- c(net2, temp[index2,]$net1)
  
  temp[index,]$visited = 1
  sliced <- temp[index,]
  temp <- temp[temp$visited == 0,]
  for (i in 1:length(year)) {
    matches[i] = list(
      round = sliced$round[i], 
      year = sliced$year[i],
      winner = which(player_names == sliced$winner[i]),
      firstServe = list(firstServe1[[i]], firstServe2[i]),
      aces = list(ace1[i], ace2[i]),
      doubles = list(double1[i], double2[i]),
      firstPointWon = list(firstPointWon1[i], firstPointWon2[i]),
      secPointWon = list(secPointWon1[i], secPointWon2[i]),
      fastServe = list(fastServe1[i], fastServe2[i]),
      avgFirstServe = list(avgFirstServe1[i], avgFirstServe2[i]),
      avgSecServe = list(avgSecServe1[i], avgSecServe2[i]),
      breaks = list(break1[i], break2[i]),
      returns = list(return1[i], return2[i]),
      total = list(total1[i], total2[i]),
      winnerpts = list(winner1[i], winner2[i]),
      errors = list(error1[i], error2[i]),
      nets = list(net1[i], net2[i])
    )
  }
  pairs[[match_count]] = list(player = list(player1, player2), 
                              matches = list(round = sliced$round, 
                                             year = sliced$year,
                                             winner = which(player_names == sliced$winner),
                                             firstServe = list(firstServe1, firstServe2),
                                             aces = list(ace1, ace2),
                                             doubles = list(double1, double2),
                                             firstPointWon = list(firstPointWon1, firstPointWon2),
                                             secPointWon = list(secPointWon1, secPointWon2),
                                             fastServe = list(fastServe1, fastServe2),
                                             avgFirstServe = list(avgFirstServe1, avgFirstServe2),
                                             avgSecServe = list(avgSecServe1, avgSecServe2),
                                             breaks = list(break1, break2),
                                             returns = list(return1, return2),
                                             total = list(total1, total2),
                                             winnerpts = list(winner1, winner2),
                                             errors = list(error1, error2),
                                             nets = list(net1, net2)))
  match_count <- match_count + 1
}

output = toJSON(list(players = players, pairs = pairs), pretty = T, auto_unbox = T)
write(output, 'data.json')

#for (i in 1:dim(data)[1]) {
#  if ()
#  temp <- data[i,]
#  player1 <- which(player_name == temp$player1)
#  player2 <- which(player_name == temp$player2)
#  if (player1 > player2) {
#    temp_name <- player1
#    player1 <- player2
#    player2 <- temp_name
#  }
#  data[(data$player1 == player_names[player1] & data$player2 == player_names[player2]) 
#      | (data$player2 == player_names[player1] & data$player1 == player_names[player2]),]
#}

#for (i in 1:dim(data)[1]) {
#  data[i, 'players'] <- paste0(sort(c(input_data[i, 'player1'], input_data[i, 'player2'])), collapse = "")
#}
#data$players = factor(data$players)



#win_stat = winner_stat[order(winner_stat$freq, decreasing = T),]




#data$winner[winner_stat]